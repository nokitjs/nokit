import { CTL_INFO } from './constants';

/**
 * 控制器信息
 */
export interface IControllerInfo {
  path: string;
}

/**
 * 控制器注解，可用来声明一个 Controller 类
 * @param path 请求路径，可少略，默认为 `/`
 */
export function controller(path: string = '/') {
  return (target: any) => {
    Reflect.metadata(CTL_INFO, { path })(target);
  }
}

/**
 * 获取控制器信息
 * @param target 对应的 controller 类
 */
export function getControllerInfo(target: any) {
  return Reflect.getMetadata(CTL_INFO, target) as IControllerInfo;
}