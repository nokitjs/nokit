import { Context } from "koa";
import { getByPath } from "../common/utils";
import { getControllerInfo, IControllerInfo } from "./Controller";
import { getCtxInfos } from "./Context";
import { getMappingInfos, IMappingInfo } from "./Mapping";
import { IoCLoader } from "../IoCLoader";
import { normalize } from "path";

/**
 * Controller 加载器
 */
export class ControllerLoader<T = any[]> extends IoCLoader<T> {
  /**
   * 获取请求方法
   * @param verb 请求动作（HTTP Method）
   */
  private getHttpMethods(verb: string | string[]) {
    return Array.isArray(verb) ? verb : [verb];
  }

  /**
   * 注册一个路由映射
   * @param app 应用实例
   * @param CtlType 控制器类
   * @param ctlInfo 控制器信息
   * @param mapInfo 映射信息
   */
  private regRoute(
    CtlType: any,
    ctlInfo: IControllerInfo,
    mapInfo: IMappingInfo
  ) {
    const { path, verb, method } = mapInfo;
    const httpMethods = this.getHttpMethods(verb);
    this.app.router.register(
      normalize(`/${ctlInfo.path}/${path}`),
      httpMethods,
      async (ctx: any, next: Function) => {
        const ctlInstance = new CtlType();
        this.container.inject(ctlInstance);
        ctx.body = await this.invokeCtlMethod(ctx, ctlInstance, method);
        ctx.preventCahce = true;
        await next();
      }
    );
  }

  /**
   * 执行控制器方法
   * @param ctx 请求上下文
   * @param ctlInstance 控制器实例
   * @param method 控制器方法
   */
  private async invokeCtlMethod(
    ctx: Context,
    ctlInstance: any,
    method: string
  ) {
    const parameters = getCtxInfos(ctlInstance, method)
      .sort((a, b) => (a.index || 0) - (b.index || 0))
      .map(info => getByPath(ctx, info.name));
    return ctlInstance[method](...parameters);
  }

  /**
   * 注册 Controller
   * @param app 应用实例
   * @param CtlType 控制器类
   */
  private regCtlType(CtlType: any) {
    const ctlInfo = getControllerInfo(CtlType);
    const mapppingInfos = getMappingInfos(CtlType);
    if (!ctlInfo || !mapppingInfos || mapppingInfos.length < 1) return;
    mapppingInfos.forEach((mapInfo: IMappingInfo) => {
      this.regRoute(CtlType, ctlInfo, mapInfo);
    });
  }

  /**
   * 加载所有 Controller
   */
  public async load() {
    await super.load();
    this.content.forEach((CtlType: any) => this.regCtlType(CtlType));
    this.app.logger.info("Controller ready");
  }
}
