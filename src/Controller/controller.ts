import { CTL_INFO } from "./constants";

export interface IControllerInfo {
  pattern: string;
}

/**
 * 声明一个 Controller 类
 * @param pattern 请求路径
 */
export function controller(pattern: string) {
  return (target: any) => {
    Reflect.metadata(CTL_INFO, { pattern });
  }
}

export function getControllerInfo(type: any) {
  return Reflect.getMetadata(CTL_INFO, type) as IControllerInfo;
}