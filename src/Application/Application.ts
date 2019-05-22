import * as Koa from "koa";
import * as Router from "koa-router";
import { acquire } from "../common/oneport";
import { builtLoaders } from "./builtInLoaders";
import { CONFIG_ENTITY_KEY, ConfigLoader } from "../ConfigLoader";
import { Container } from "../IoCLoader";
import { EventEmitter } from "events";
import { IApplicationOptions } from "./IApplicationOptions";
import { ILoader, ILoaderInfo, ILoaderConstructor } from "../AbstractLoader";
import { normalize } from "path";
import { IApplication } from "./IApplication";
import { ILaunchInfo } from "./ILaunchInfo";
import { ENV_NAME } from "./constants";

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

  /**
   * 全局应用构造函数
   * @param options 应用程序类构建选项
   */
  constructor(public options: IApplicationOptions = {}) {
    super();
    if (!this.options.root) this.options.root = process.cwd();
  }

  /**
   * 加载配置
   */
  protected loadConfig() {
    const configLoader = new ConfigLoader(this, { path: "./configs/config" });
    return configLoader.load();
  }

  /**
   * 加载一个 loader
   * @param name loader 名称
   */
  protected importLoader(name: string): ILoaderConstructor {
    const { root } = this.options;
    const path = normalize(`${root}/node_modules/${name}`);
    const loader = require(path);
    return loader.default || loader;
  }

  /**
   * 创建一个 loader 实例
   * @param loaderInfo loader 信息
   */
  protected createLoaderInstance(loaderInfo: ILoaderInfo) {
    const { name, loader, options } =
      builtLoaders.find(info => info.name === loaderInfo.name) || loaderInfo;
    const config = this.config.loaders && this.config.loaders[name];
    if (config === false) return;
    const Loader = loader ? loader : this.importLoader(name);
    return new Loader(this, { ...options, ...config });
  }

  /**
   * 获取内建的 loaders
   */
  protected getBuiltInLoaders(): ILoaderInfo[] {
    return builtLoaders;
  }

  /**
   * 获取项目配置的 loaders
   */
  protected getConfigLoaders(): ILoaderInfo[] {
    const loaders = this.config.loaders;
    if (!loaders) return [];
    return Object.keys(loaders).map(name => ({ name }));
  }

  /**
   * 获取所有 loaders
   */
  protected getAllLoaderInstances(): ILoader[] {
    return [...this.getBuiltInLoaders(), ...this.getConfigLoaders()]
      .map(info => this.createLoaderInstance(info))
      .filter(instance => !!instance);
  }

  /**
   * 启动当前应用实例
   */
  public async launch(): Promise<ILaunchInfo> {
    await this.loadConfig();
    const { port = this.config.port || (await acquire()) } = this.options;
    const loaders = await this.getAllLoaderInstances();
    for (let loader of loaders) await loader.load();
    this.server.use(this.router.routes());
    this.server.use(this.router.allowedMethods());
    this.server.listen(port);
    return { app: this, port };
  }
}
