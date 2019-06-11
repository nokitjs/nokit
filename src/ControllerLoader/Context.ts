import { CTL_PARAMETER } from "./constants";

/**
 * 请求上下文注入映射信息
 */
export interface ICtxMappingInfo {
  type: string;
  name: string;
  index: number;
}

/**
 * 从 ctx 上获取内容
 * @param name JSON Path
 */
export function Ctx(name = ".") {
  return (target: any, member: string, index: number) => {
    const type = "ctx",
      list = getCtxInfos(target, member);
    list.push({ type, name, index });
    Reflect.metadata(CTL_PARAMETER, list)(target, member);
  };
}

/**
 * 请求对象
 */
export const Req = () => Ctx("request");

/**
 * 响应对象
 */
export const Res = () => Ctx("response");

/**
 * Cookie 信息
 */
export const Cookie = () => Ctx("cookies");

/**
 * 路由参数
 * @param name 路由参数名
 */
export const Param = (name?: string) =>
  name ? Ctx(`params.${name}`) : Ctx("params");

/**
 * 获取请求主体
 * @param name 请求主体参数
 */
export const Body = (name?: string) =>
  name ? Ctx(`request.body.${name}`) : Ctx("request.body");

/**
 * 获取查询参数
 * @param name 查询参数名
 */
export const Query = (name?: string) =>
  name ? Ctx(`query.${name}`) : Ctx("query");

/**
 * 获取请求头参数
 * @param name 查询参数名
 */
export const Header = (name?: string) =>
  name ? Ctx(`headers.${name}`) : Ctx("headers");

/**
 * 获取控制器方法的参数注入信息
 * @param target 控制器
 * @param member 控制器方法名
 */
export function getCtxInfos(target: any, member: string) {
  const list = Reflect.getMetadata(CTL_PARAMETER, target, member) || [];
  return list as ICtxMappingInfo[];
}
