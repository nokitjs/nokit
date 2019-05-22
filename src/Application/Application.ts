import * as console from "../common/console";
import * as Koa from "koa";
import * as Router from "koa-router";
import { acquire } from "../common/oneport";
import { builtLoaders } from "./builtInLoaders";
import { CONFIG_KEY, ConfigLoader } from "../ConfigLoader";
import { Container } from "../IoCLoader";
import { EventEmitter } from "events";
import { IApplicationOptions } from "./IApplicationOptions";
import { ILoader, ILoaderInfo } from "../AbstractLoader";
import { normalize } from "path";
import { IApplication } from "./IApplication";

/**
 * 全局应用程序类，每一个应用都会由一个 Application 实例开始
 */
export class Application extends EventEmitter implements IApplication {
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
    return this.container.values[CONFIG_KEY] || {};
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
    const configLoader = new ConfigLoader({ path: "./configs/config" });
    return configLoader.load(this);
  }

  /**
   * 加载一个 loader
   * @param name loader 名称
   */
  protected importLoader(name: string) {
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
    return new Loader({ ...options, ...config });
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
  public async run() {
    await this.loadConfig();
    const { port = this.config.port || (await acquire()) } = this.options;
    const loaders = await this.getAllLoaderInstances();
    for (let loader of loaders) await loader.load(this);
    this.server.use(this.router.routes());
    this.server.use(this.router.allowedMethods());
    this.server.listen(port);
    console.info("Application running:", `http://localhost:${port}`);
  }
}
