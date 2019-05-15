import { Context, } from 'koa';
import { getAllMappingInfos } from './mapping';
import { getControllerInfo } from './controller';
import { IApplication } from '../Application/IApplication';
import { IoCLoader } from '../Loader';
import { normalize } from "path";

export class ControllerLoader<T> extends IoCLoader<T> {

  public async load(app: IApplication) {
    await super.load(app);
    this.content.forEach((ctlType: any) => {
      const ctlInfo = getControllerInfo(ctlType);
      const mappingInfos = getAllMappingInfos(ctlType);
      mappingInfos.forEach(mappingInfo => {
        const { pattern, verb, method } = mappingInfo;
        const httpMethods = Array.isArray(verb) ?
          verb as string[] : [verb as string];
        const routePath = normalize(`${ctlInfo.pattern}/${pattern}`);
        app.router.register(routePath, httpMethods,
          async (ctx: Context, next: Function) => {
            const ctlInstance = new ctlType();
            app.container.applyInjection(ctlInstance);
            ctx.body = await ctlInstance[method]();
            return next();
          });
      });
    });
  }
}