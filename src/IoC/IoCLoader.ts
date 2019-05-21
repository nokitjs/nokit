import { AbstractLoader } from '../Loader/AbstractLoader';
import { IApplication } from '../Application/IApplication';

/**
 * IoC 加载器
 */
export class IoCLoader<T = any> extends AbstractLoader<T> {

  /**
   * 加载指定类型到容器中
   * @param app 应用实例
   */
  public async load<T>(app: IApplication) {
    await super.load<T>(app);
    app.container.register(this.content);
  }

}