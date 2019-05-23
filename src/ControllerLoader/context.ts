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
export function ctx(name = ".") {
  return (target: any, member: string, index: number) => {
    const type = "ctx",
      list = getCtxMappingInfos(target, member);
    list.push({ type, name, index });
    Reflect.metadata(CTL_PARAMETER, list)(target, member);
  };
}

/**
 * 请求对象
 */
export const req = () => ctx("request");

/**
 * 响应对象
 */
export const res = () => ctx("response");

/**
 * Cookie 信息
 */
export const cookie = () => ctx("cookies");

/**
 * 路由参数
 * @param name 路由参数名
 */
export const param = (name?: string) =>
  name ? ctx(`params.${name}`) : ctx("params");

/**
 * 获取请求主体
 * @param name 请求主体参数
 */
export const body = (name?: string) =>
  name ? ctx(`request.body.${name}`) : ctx("request.body");

/**
 * 获取查询参数
 * @param name 查询参数名
 */
export const query = (name?: string) =>
  name ? ctx(`query.${name}`) : ctx("query");

/**
 * 获取请求头参数
 * @param name 查询参数名
 */
export const header = (name?: string) =>
  name ? ctx(`headers.${name}`) : ctx("headers");

/**
 * 获取控制器方法的参数注入信息
 * @param target 控制器
 * @param member 控制器方法名
 */
export function getCtxMappingInfos(target: any, member: string) {
  const list = Reflect.getMetadata(CTL_PARAMETER, target, member) || [];
  return list as ICtxMappingInfo[];
}
