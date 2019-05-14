const metadataKey = 'request-mapping';

/**
 * 路由映射，声明允许的请求方法有路径
 * @param method Http Method
 * @param path 请求路径
 */
export function mapping(method: string, path: string) {
  return (target: any, name?: string | symbol) => {
    const mappings = Reflect.getMetadata(metadataKey, target, name) || [];
    mappings.push({ method, path });
    Reflect.metadata(metadataKey, mappings)(target, name);
  };
}

/**
 * 获取所有路由映射 
 * @param target 类或原型 
 * @param name 成员名称
 */
export function getAllMappings(target: any, name: string | symbol) {
  return Reflect.getMetadata(metadataKey, target, name);
}

/**
 * 映射 GET 请求
 * @param path 请求路径
 */
export const get = (path: string) => mapping('GET', path);

/**
 * 映射 POST 请求
 * @param path 请求路径
 */
export const post = (path: string) => mapping('POST', path);

/**
 * 映射 PUT 请求
 * @param path 请求路径
 */
export const put = (path: string) => mapping('PUT', path);

/**
 * 映射 DELETE 请求
 * @param path 请求路径
 */
export const del = (path: string) => mapping('DELETE', path);

/**
 * 映射 OPTIONS 请求
 * @param path 请求路径
 */
export const options = (path: string) => mapping('OPTIONS', path);

/**
 * 映射 PATCH 请求
 * @param path 请求路径
 */
export const patch = (path: string) => mapping('PATCH', path);

/**
 * 映射 HEAD 请求
 * @param path 请求路径
 */
export const head = (path: string) => mapping('HEAD', path);