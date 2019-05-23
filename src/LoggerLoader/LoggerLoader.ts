import * as log4js from "koa-log4";
import { AbstractLoader } from "../AbstractLoader";
// import { LOGGER_ENTITY_KEY } from "./constants";
import { mix } from "../common/utils";

const defaultOptions: any = {
  appenders: {
    access: {
      type: "console",
      filename: "./access",
      pattern: "-yyyy-MM-dd",
      keepFileExt: true,
      alwaysIncludePattern: true,
      level: "trace",
      maxLevel: "info"
    },
    error: {
      type: "console",
      filename: "./error",
      pattern: "-yyyy-MM-dd",
      keepFileExt: true,
      alwaysIncludePattern: true
    }
  },
  categories: {
    default: { appenders: ['access', 'error'], level: 'all' },
    // app: { appenders: ['access', 'error'], level: 'all' },
    // ctx: { appenders: ['access', 'error'], level: 'all' }
  }
};

/**
 * 日志加载器
 */
export class LoggerLoader<T = any> extends AbstractLoader<T> {
  /**
   * 初始化日志模块
   */
  public async load() {
    const options = mix({ ...defaultOptions }, this.options);
    log4js.configure(options);
    this.server.use(log4js.koaLogger(log4js.getLogger('access'), { level: 'auto' }));
    // const getLogger = (category?: string) => log4js.getLogger(category);
    // this.container.registerValue(LOGGER_ENTITY_KEY, getLogger);
  }
}
