import { Middleware } from "koa";
import * as compose from "koa-compose";

import { ILoader } from "../Loader";
import { IApplication } from "../Application";

function use(...middleware: Middleware[]): ILoader<any> {
  return {
    async load(app: IApplication) {
      app.server.use(compose(middleware));
    }
  }
}

export { use };