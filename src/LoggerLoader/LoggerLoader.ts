import { AbstractLoader } from "../AbstractLoader";
import { Logger, Level } from "hilog";
import { mix } from "../common/utils";
import { resolve } from "path";
import { LOGGER_ENTITY_KEY } from "./constants";
import { EOL } from "os";

const defaultOptions: any = {
  writers: {
    error: {
      type: "console",
      categories: ["*"],
      level: [Level.warn, Level.error],
      location: "./error-yyyy-MM-dd.log"
    },
    app: {
      type: "console",
      categories: ["app"],
      level: [Level.debug, Level.info],
      location: "./app-yyyy-MM-dd.log"
    },
    ctx: {
      type: "console",
      categories: ["ctx"],
      level: [Level.debug, Level.info],
      location: "./ctx-yyyy-MM-dd.log"
    },
    access: {
      type: "console",
      categories: ["access"],
      level: [Level.info],
      format: "[:time] - :method :url :status :rtms #:pid",
      location: "./access-yyyy-MM-dd.log"
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
    const options = mix({ root: "./logs/", ...defaultOptions }, this.options);
    options.root = resolve(this.root, options.root);
    await Logger.init(options);
    const getLogger = (category?: string) => Logger.get(category);
    this.container.registerValue(LOGGER_ENTITY_KEY, getLogger);
    this.server.use(async (ctx, next) => {
      ctx.logger = await getLogger("ctx");
      const startTime = Date.now();
      await next();
      const rt = Date.now() - startTime;
      const { method, url, status, headers } = ctx;
      const ua = `"${headers["user-agent"]}"`;
      const fields = { method, url, status, rt, ua };
      getLogger("access").write(Level.info, fields, "");
    });
    this.server.on("error", (err, ctx) => {
      const { method, url, status, headers } = ctx;
      const ua = `"${headers["user-agent"]}"`;
      ctx.logger.error(method, url, ua, status, EOL, err);
      ctx.status = 500;
    });
  }
}
