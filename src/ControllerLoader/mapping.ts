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
export function mapping(verb: string, path = "/") {
  return (target: any, method: string) => {
    const mappings = getAllMappingInfos(target);
    mappings.push({ verb, path, method });
    Reflect.metadata(CTL_MAPPING, mappings)(target.constructor);
  };
}

/**
 * 获取所有路由映射
 * @param target 类或原型
 */
export function getAllMappingInfos(target: any) {
  const list = Reflect.getMetadata(CTL_MAPPING, target) || [];
  return list as IMappingInfo[];
}

/**
 * 映射 GET 请求
 * @param path 请求路径
 */
export const get = (path = "/") => mapping("GET", path);

/**
 * 映射 POST 请求
 * @param path 请求路径
 */
export const post = (path = "/") => mapping("POST", path);

/**
 * 映射 PUT 请求
 * @param path 请求路径
 */
export const put = (path = "/") => mapping("PUT", path);

/**
 * 映射 DELETE 请求
 * @param path 请求路径
 */
export const del = (path = "/") => mapping("DELETE", path);

/**
 * 映射 OPTIONS 请求
 * @param path 请求路径
 */
export const options = (path = "/") => mapping("OPTIONS", path);

/**
 * 映射 PATCH 请求
 * @param path 请求路径
 */
export const patch = (path = "/") => mapping("PATCH", path);

/**
 * 映射 HEAD 请求
 * @param path 请求路径
 */
export const head = (path = "/") => mapping("HEAD", path);
