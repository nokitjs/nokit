import * as session from "koa-session";
import { AbstractLoader } from "../AbstractLoader";
import { pkg, uuid } from "../common/utils";

const defaultOptions: any = {
  key: pkg.displayName.toUpperCase(),
  maxAge: 86400000
};

const SIGN_KEYS: string[] = [uuid()];

/**
 * Session 加载器
 */
export class SessionLoader<T = any> extends AbstractLoader<T> {
  /**
   * 加载 Session
   */
  public async load() {
    const options = { ...defaultOptions, ...this.options };
    this.server.keys = options.keys || SIGN_KEYS;
    this.server.use(session(options, this.server));
    this.app.logger.info("Session ready");
  }
}
