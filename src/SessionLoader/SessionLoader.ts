import * as session from "koa-session";
import { AbstractLoader } from "../AbstractLoader";
import { pkg } from "../common/utils";

const defaultOptions: any = {
  key: `${pkg.name[0]}sid`.toUpperCase(),
  maxAge: 86400000
};

/**
 * Session 加载器
 */
export class SessionLoader<T = any> extends AbstractLoader<T> {
  /**
   * 加载 Session
   */
  public async load() {
    const options = { ...defaultOptions, ...this.options };
    this.server.keys = options.keys || [options.key];
    this.server.use(session(options, this.server));
  }
}
