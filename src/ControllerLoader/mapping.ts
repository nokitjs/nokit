import { CTL_MAPPING } from "./constants";

/**
 * 路由映射信息
 */
export interface IMappingInfo {
  verb: string | string[];
  path: string;
  method: string;
}

/**
 * 路由映射，声明允许的请求方法有路径
 * @param verb Http Method
 * @param path 请求路径
 */
export function Mapping(verb: string, path = "/") {
  return (target: any, method: string) => {
    const controller = target.constructor;
    const mappings = getMappingInfos(controller);
    mappings.push({ verb, path, method });
    Reflect.metadata(CTL_MAPPING, mappings)(controller);
  };
}

/**
 * 获取所有路由映射
 * @param target 类或原型
 */
export function getMappingInfos(target: any) {
  const list = Reflect.getMetadata(CTL_MAPPING, target) || [];
  return list as IMappingInfo[];
}

/**
 * 映射 GET 请求
 * @param path 请求路径
 */
export const Get = (path = "/") => Mapping("GET", path);

/**
 * 映射 POST 请求
 * @param path 请求路径
 */
export const Post = (path = "/") => Mapping("POST", path);

/**
 * 映射 PUT 请求
 * @param path 请求路径
 */
export const Put = (path = "/") => Mapping("PUT", path);

/**
 * 映射 DELETE 请求
 * @param path 请求路径
 */
export const Del = (path = "/") => Mapping("DELETE", path);

/**
 * 映射 OPTIONS 请求
 * @param path 请求路径
 */
export const Options = (path = "/") => Mapping("OPTIONS", path);

/**
 * 映射 PATCH 请求
 * @param path 请求路径
 */
export const Patch = (path = "/") => Mapping("PATCH", path);

/**
 * 映射 HEAD 请求
 * @param path 请求路径
 */
export const Head = (path = "/") => Mapping("HEAD", path);
