import * as compose from 'koa-compose';
import { IApplication } from '../Application';
import { ILoader } from '../Loader';
import { Middleware } from 'koa';

/**
 * 应用一个中间件，use 会将中间件转换为可配置的 loader
 * 需要在创建 Appliction 实例时通过 loaders 配置传入
 * @param middleware 中间件
 */
function use(...middleware: Middleware[]): ILoader<any> {
  return {
    async load(app: IApplication) {
      app.server.use(compose(middleware));
    }
  }
}

export { use };