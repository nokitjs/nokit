import { mapping } from "./mapping";

/**
 * 声明一个 Controller 类
 * @param path 请求路径
 */
export function controller(path: string) {
  return (target: any) => {
    Reflect.metadata('controller', true);
    return mapping('*', path)(target);
  }
}