import { IOC_PROVIDER } from "./constants";

/**
 * provider 选项
 */
export interface IProviderOptions {
  singleton?: boolean;
}

/**
 * provider 信息
 */
export interface IProviderInfo {
  name: string;
  options: IProviderOptions;
}

/**
 * 声明一个类，将其放入 IoC 容器内
 * @param name 名称
 */
export function provider(name: string, options: IProviderOptions = {}) {
  return (target: any) =>
    Reflect.metadata(IOC_PROVIDER, { name, options })(target);
}

/**
 * 获取一个类型的 provider 名称
 * @param target 类型
 */
export function getProviderName(target: any) {
  return Reflect.getMetadata(IOC_PROVIDER, target) as IProviderInfo;
}