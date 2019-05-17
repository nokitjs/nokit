import { AbstractLoader } from '../Loader';
import { IApplication } from '../Application/IApplication';

const pkg = require('../../package.json');

/**
 * 静态资源加载器
 */
export class InfoLoader<T> extends AbstractLoader<T> {

  /**
   * 加载一个框架信息
   * @param app 应用实例
   */
  public async load(app: IApplication) {
    app.server.use((ctx, next) => {
      ctx.set('Server', pkg.displayName);
      next();
    });
  }

}