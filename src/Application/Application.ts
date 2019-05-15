import * as console from '../common/console';
import * as Koa from 'koa';
import { acquire } from '../common/oneport';
import { ControllerLoader } from '../Controller';
import { EventEmitter } from 'events';
import { IApplication } from './IApplication';
import { IApplicationOptions } from './IApplicationOptions';
import { ILoader } from '../Loader';
import { ServiceLoader } from '../Service';
import { ConfLoader } from '../Conf/ConfLoader';
import { IoCContainer } from '../IoC';

/**
 * 全局应用程序类，每一个应用都会由一个 Application 实例开始
 */
export class Application extends EventEmitter implements IApplication {

  /**
   * 对应的 koa 实例
   */
  public server = new Koa();

  /**
   * IoC 容器实例
   */
  public container = new IoCContainer();

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
      new ConfLoader('./config'),
      new ServiceLoader('./src/**/*.service.{ts,js}'),
      new ControllerLoader('./src/**/*.controller.{ts,js}'),
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
    this.server.listen(port);
    console.info("Application running:", `http://localhost:${port}`);
  }

}