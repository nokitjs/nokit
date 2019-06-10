import * as compose from "koa-compose";
import * as serve from "koa-static";
import { AbstractLoader } from "../AbstractLoader";
import { existsSync } from "fs";
import { resolve } from "path";

const conditional = require("koa-conditional-get");
const etag = require("koa-etag");

/**
 * 静态资源 加载器
 */
export class StaticLoader<T = any> extends AbstractLoader<T> {
  /**
   * 加载静态资源相关模块
   */
  public async load() {
    const { path } = this.options;
    const staticRoot = resolve(this.root, path);
    if (!existsSync(staticRoot)) return;
    this.server.use(async (ctx, next) => {
      await next();
      if (ctx.preventCahce) return;
      const noopNext: any = () => {};
      await compose([conditional(), etag()])(ctx, noopNext);
    });
    this.server.use(serve(staticRoot));
    this.app.logger.info("Static ready");
  }
}
