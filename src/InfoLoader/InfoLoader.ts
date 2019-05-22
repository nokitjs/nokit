import { AbstractLoader } from "../AbstractLoader";

const pkg = require("../../package.json");

/**
 * 静态资源加载器
 */
export class InfoLoader<T = any> extends AbstractLoader<T> {
  /**
   * 加载一个框架信息
   */
  public async load() {
    this.app.server.use(async (ctx, next) => {
      ctx.set("Server", pkg.displayName);
      await next();
    });
  }
}
