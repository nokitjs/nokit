import { AbstractLoader } from "../AbstractLoader";
import { Logger, Level } from "hilog";
import { mix } from "../common/utils";
import { resolve } from "path";
import { LOGGER_ENTITY_KEY } from "./constants";

const defaultOptions: any = {
  writers: {
    error: {
      type: "console",
      categories: ["*"],
      level: [Level.warn, Level.error]
    },
    app: {
      type: "console",
      categories: ["app"],
      level: [Level.debug, Level.info]
    },
    ctx: {
      type: "console",
      categories: ["ctx"],
      level: [Level.debug, Level.info]
    },
    access: {
      type: "console",
      categories: ["access"],
      level: [Level.info],
      format: "[:time] - :method :url :status #:pid"
    }
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
    const root = resolve(this.root, "./logs/");
    const options = mix({ root, ...defaultOptions }, this.options);
    await Logger.init(options);
    const getLogger = (category?: string) => Logger.get(category);
    this.container.registerValue(LOGGER_ENTITY_KEY, getLogger);
    this.server.use(async (ctx, next) => {
      ctx.logger = await getLogger("ctx");
      await next();
      const { method, url, status } = ctx;
      getLogger("access").write(Level.info, { method, url, status }, "");
    });
    this.app.logger.info("Logger loaded");
  }
}
