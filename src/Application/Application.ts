import * as Koa from "koa";
import * as Router from "koa-router";
import { acquire } from "../common/oneport";
import { builtLoaders } from "./builtInLoaders";
import { CONF_RESERVEDS, ENV_NAME } from "./constants";
import { CONFIG_ENTITY_KEY, ConfigLoader } from "../ConfigLoader";
import { Container } from "../IoCLoader";
import { dirname, normalize, resolve } from "path";
import { EventEmitter } from "events";
import { existsSync } from "fs";
import { IApplication } from "./IApplication";
import { IApplicationOptions } from "./IApplicationOptions";
import { ILaunchInfo } from "./ILaunchInfo";
import { ILoader } from "../AbstractLoader/ILoader";
import { ILoaderConstructor } from "../AbstractLoader/ILoaderConstructor";
import { ILoaderInfo, ILoaderInfoMap } from "../AbstractLoader/ILoaderInfo";
import { isObject } from "util";

/**
 * 全局应用程序类，每一个应用都会由一个 Application 实例开始
 */
export class Application extends EventEmitter implements IApplication {
  /**
   * 当前环境标识
   */
  public readonly env = process.env[ENV_NAME] || process.env.NODE_ENV;

  /**
   * 对应的 koa 实例
   */
  public readonly server = new Koa();

  /**
   * IoC 容器实例
   */
  public readonly container = new Container();

  /**
   * 应用路由
   */
  public readonly router = new Router();

  /**
   * 应用配置对象
   */
  public get config() {
    return this.container.get(CONFIG_ENTITY_KEY) || {};
  }

  private __root: string;

  /**
   * 是否是系统根目录
   * @param dir 目录
   */
  private isSystemRootDir(dir: string) {
    return !dir || dir === "/" || dir.endsWith(":\\") || dir.endsWith(":\\\\");
  }

  /**
   * 目录中存在 package.json
   * @param dir 目录
   */
  private existsPackage(dir: string) {
    return existsSync(normalize(`${dir}/package.json`));
  }

  /**
   * 应用根目录
   */
  public get root() {
    if (this.options.root) return this.options.root;
    if (this.__root) return this.__root;
    let root = dirname(process.argv[1]);
    while (!this.isSystemRootDir(root) && !this.existsPackage(root)) {
      root = dirname(root);
    }
    if (this.isSystemRootDir(root) || root === ".") root = process.cwd();
    this.__root = root;
    return this.__root;
  }

  /**
   * 全局应用构造函数
   * @param options 应用程序类构建选项
   */
  constructor(protected options: IApplicationOptions = {}) {
    super();
  }

  /**
   * 加载配置
   */
  protected loadConfig() {
    const configLoader = new ConfigLoader(this, { path: "./configs/config" });
    return configLoader.load();
  }

  /**
   * 获取内建的 loaders
   */
  protected getBuiltInLoaders(): ILoaderInfoMap {
    return builtLoaders;
  }

  /**
   * 字符串是不是一个路戏
   * @param str 字符串
   */
  private isPath(str: string) {
    if (!str) return false;
    return str.startsWith("/") || str.startsWith(".") || /^[a-z]+\:/i.test(str);
  }

  /**
   * 加载一个 loader
   * @param name loader 名称
   */
  protected importLoader(name: string): ILoaderConstructor {
    name = String(name);
    const { root } = this.options;
    const loaderPath = this.isPath(name)
      ? resolve(root, name)
      : normalize(`${root}/node_modules/${name}`);
    const loader = require(loaderPath);
    return loader.default || loader;
  }

  /**
   * 创建一个 loader 实例
   * @param loaderInfo loader 信息
   * @param configKey 配置名称
   */
  protected createLoaderInstance(loaderInfo: ILoaderInfo, configKey: string) {
    const { loader, options } = loaderInfo;
    const loaderConfig = this.config[configKey];
    if (loaderConfig === false) return;
    return new loader(this, { ...options, ...loaderConfig });
  }

  /**
   * 获取所有 loaders
   */
  protected createAllLoaderInstances(): ILoader[] {
    const loaderInfoMap = {
      ...this.getBuiltInLoaders(),
      ...this.config.loaders
    };
    const loaderIntances: ILoader[] = [];
    for (let name in loaderInfoMap) {
      if (CONF_RESERVEDS.includes(name)) {
        throw new Error(`Invalid Loader configuration name: ${name}`);
      }
      const value = loaderInfoMap[name];
      if (!value) continue;
      const loaderInfo = <ILoaderInfo>(
        (isObject(value) ? value : { loader: this.importLoader(value) })
      );
      const instance = this.createLoaderInstance(loaderInfo, name);
      loaderIntances.push(instance);
    }
    return loaderIntances;
  }

  /**
   * 启动当前应用实例
   */
  public async launch(): Promise<ILaunchInfo> {
    await this.loadConfig();
    const { port = this.config.port || (await acquire()) } = this.options;
    const loaders = await this.createAllLoaderInstances();
    for (let loader of loaders) await loader.load();
    this.server.use(this.router.routes());
    this.server.use(this.router.allowedMethods());
    this.server.listen(port);
    return { app: this, port };
  }
}
