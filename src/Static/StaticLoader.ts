import * as serve from 'koa-static';
import { AbstractLoader } from '../Loader';
import { IApplication } from '../Application/IApplication';
import { resolve } from 'path';

/**
 * 静态资源 加载器
 */
export class StaticLoader<T> extends AbstractLoader<T> {
  public async load(app: IApplication) {
    const staticRoot = resolve(app.options.root, <string>this.path);
    app.server.use(serve(staticRoot));
  }
}