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
import { InfoLoader } from '../Info';
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
  public readonly router = new Router()

  /**
   * 全局应用构造函数
   * @param options 应用程序类构建选项
   */
  constructor(public options: IApplicationOptions = {}) {
    super();
    if (!this.options.root) this.options.root = process.cwd();
  }

  /**
   * 获取所有可用 Loaders
   */
  protected getBuiltInLoaders(): ILoader<any>[] {
    return [
      new ConfigLoader('./config'),
      new ServiceLoader('./src/**/*.service.{ts,js}'),
      new ViewLoader('./views'),
      new ControllerLoader('./src/**/*.controller.{ts,js}'),
      new StaticLoader('./public'),
      new InfoLoader(null),
    ];
  }

  /**
   * 启动当前应用实例
   */
  public async run() {
    const { port = await acquire(), loaders = [] } = this.options;
    const builtInloaders = await this.getBuiltInLoaders();
    for (let loader of builtInloaders) await loader.load(this);
    for (let loader of loaders) await loader.load(this);
    this.server.use(this.router.routes());
    this.server.use(this.router.allowedMethods());
    this.server.listen(port);
    console.info("Application running:", `http://localhost:${port}`);
  }

}