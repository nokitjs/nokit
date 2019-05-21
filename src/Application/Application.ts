import * as console from '../common/console';
import * as Koa from 'koa';
import * as Router from 'koa-router';
import { acquire } from '../common/oneport';
import { ConfigLoader } from '../Config/ConfigLoader';
import { Container } from '../IoC';
import { ControllerLoader } from '../Controller';
import { EventEmitter } from 'events';
import { IApplication } from './IApplication';
import { IApplicationOptions } from './IApplicationOptions';
import { ILoader } from '../Loader';
import { ILoaderConstructor } from '../Loader/ILoaderConstructor';
import { ILoaderOptions } from '../Loader/ILoaderOptions';
import { InfoLoader } from '../Info';
import { resolve } from 'path';
import { ServiceLoader } from '../Service';
import { StaticLoader } from '../Static';
import { ViewLoader } from '../View';

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
   * 全局应用构造函数
   * @param options 应用程序类构建选项
   */
  constructor(public options: IApplicationOptions = {}) {
    super();
    if (!this.options.root) this.options.root = process.cwd();
  }

  /**
   * 创建一个 loader 实例
   * @param name loader 名称
   * @param defaultOptinos 默认选项
   */
  protected createLoaderInstance(name: string, defaultOptinos: ILoaderOptions) {
    const loaderFile = resolve(this.options.root, name);
    const Loader: ILoaderConstructor<any> = require(loaderFile);
    return new Loader(defaultOptinos);
  }

  /**
   * 获取内建 loaders
   */
  protected getBuiltInLoaders(): ILoader<any>[] {
    return [
      new ConfigLoader({ path: './config' }),
      new InfoLoader(null),
      new ServiceLoader({ path: './src/**/*.service.{ts,js}' }),
      new ControllerLoader({ path: './src/**/*.controller.{ts,js}' }),
      new ViewLoader({ path: './views' }),
      new StaticLoader({ path: './public' }),
    ];
  }

  /**
   * 获取项目 loaders
   */
  protected getProjectLoaders(): ILoader<any>[] {
    return [];
  }

  /**
   * 获取所有 loaders
   */
  protected getAllLoaders(): ILoader<any>[] {
    return [
      ...this.getBuiltInLoaders(),
      ...this.getProjectLoaders(),
      ...(this.options.loaders || []),
    ];
  }

  /**
   * 启动当前应用实例
   */
  public async run() {
    const { port = await acquire() } = this.options;
    const loaders = await this.getAllLoaders();
    for (let loader of loaders) await loader.load(this);
    this.server.use(this.router.routes());
    this.server.use(this.router.allowedMethods());
    this.server.listen(port);
    console.info("Application running:", `http://localhost:${port}`);
  }

}