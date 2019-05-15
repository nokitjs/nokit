import { IOC_PROP_INJECT } from "./constants";

/**
 * 注入类型
 */
export enum InjectTypes {
  Type = 'Type',
  Value = 'Value'
}

/**
 * 注入选项
 */
export interface IInjectOptions {
  type?: InjectTypes;
}

/**
 * 注入信息
 */
export interface IInjectInfo {
  provider: string;
  member: string | symbol;
  options: IInjectOptions;
}

/**
 * 声明一个类成员，通过名称在容器中查找类型并实例化后注入
 * @param provider 名称
 */
export function inject(provider: string, options: IInjectOptions = {}) {
  return (target: any, member: string | symbol) => {
    const injectInfo: IInjectInfo = { provider, member, options };
    const injectList: IInjectInfo[] = Reflect
      .getMetadata(IOC_PROP_INJECT, target) || [];
    injectList.push(injectInfo);
    Reflect.metadata(IOC_PROP_INJECT, injectList)(target);
  }
}

/**
 * 获取属性注入信息
 * @param type 类型
 */
export function getPropInjectInfos(type: any) {
  const list = Reflect.getMetadata(IOC_PROP_INJECT, type) || [];
  return list as IInjectInfo[];
}