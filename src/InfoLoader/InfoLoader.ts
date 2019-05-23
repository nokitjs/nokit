import { AbstractLoader } from "../AbstractLoader";
import { pkg } from "../common/utils";

/**
 * 静态资源加载器
 */
export class InfoLoader<T = any> extends AbstractLoader<T> {
  /**
   * 加载一个框架信息
   */
  public async load() {
    this.server.use(async (ctx, next) => {
      ctx.set("Server", pkg.displayName);
      await next();
    });
  }
}
