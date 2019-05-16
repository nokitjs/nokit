import * as serve from 'koa-static';
import { AbstractLoader } from '../Loader';
import { IApplication } from '../Application/IApplication';
import { resolve } from 'path';
import * as compose from "koa-compose";

const conditional = require('koa-conditional-get');
const etag = require('koa-etag');

/**
 * 静态资源 加载器
 */
export class StaticLoader<T> extends AbstractLoader<T> {
  public async load(app: IApplication) {
    const staticRoot = resolve(app.options.root, <string>this.path);
    app.server.use(async (ctx, next) => {
      await next();
      if (ctx.preventCahce) return;
      const fakedNext: any = () => { };
      await compose([conditional(), etag()])(ctx, fakedNext);
    });
    app.server.use(serve(staticRoot));
  }
} 