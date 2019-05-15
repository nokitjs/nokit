import * as console from '../common/console';
import * as Koa from 'koa';
import { acquire } from '../common/oneport';
import { ControllerLoader } from '../Controller';
import { EventEmitter } from 'events';
import { IApplication } from './IApplication';
import { IApplicationOptions } from './IApplicationOptions';
import { ILoader } from '../Loader';
import { ServiceLoader } from '../Service';

/**
 * 全局应用程序类，每一个应用都会由一个 Application 实例开始
 */
export class Application extends EventEmitter implements IApplication {

  /**
   * 对应的 koa 实例
   */
  public server = new Koa();

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
  protected getLoaders(): ILoader<any>[] {
    return [
      new ServiceLoader('./src/**/*.service.{ts,js}'),
      new ControllerLoader('./src/**/*.controller.{ts,js}'),
    ];
  }

  /**
   * 启动当前应用实例
   */
  public async run() {
    const { port = await acquire() } = this.options;
    const loaders = await this.getLoaders();
    await Promise.all(loaders.map(loader => loader.load(this)));
    this.server.listen(port);
    console.info("Application running:", `http://localhost:${port}`);
  }

}