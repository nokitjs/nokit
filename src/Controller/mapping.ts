import { CTL_MAPPING } from "./constants";

export interface IMappingInfo {
  verb: string | string[];
  pattern: string;
  method: string;
}

/**
 * 路由映射，声明允许的请求方法有路径
 * @param verb Http Method
 * @param pattern 请求路径
 */
export function mapping(verb: string, pattern: string) {
  return (target: any, method: string) => {
    const mappings = getAllMappingInfos(target);
    mappings.push({ verb, pattern, method });
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
 * @param pattern 请求路径
 */
export const get = (pattern: string) => mapping('GET', pattern);

/**
 * 映射 POST 请求
 * @param pattern 请求路径
 */
export const post = (pattern: string) => mapping('POST', pattern);

/**
 * 映射 PUT 请求
 * @param pattern 请求路径
 */
export const put = (pattern: string) => mapping('PUT', pattern);

/**
 * 映射 DELETE 请求
 * @param pattern 请求路径
 */
export const del = (pattern: string) => mapping('DELETE', pattern);

/**
 * 映射 OPTIONS 请求
 * @param pattern 请求路径
 */
export const options = (pattern: string) => mapping('OPTIONS', pattern);

/**
 * 映射 PATCH 请求
 * @param pattern 请求路径
 */
export const patch = (pattern: string) => mapping('PATCH', pattern);

/**
 * 映射 HEAD 请求
 * @param pattern 请求路径
 */
export const head = (pattern: string) => mapping('HEAD', pattern);