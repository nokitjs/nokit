import { IInjectInfo } from "./IInjectInfo";
import { IInjectOptions } from "./IInjectOptions";
import { IOC_PROP_INJECT } from "./constants";

/**
 * 注入一个类成员，通过名称在容器中查找类型并实例化后注入
 * @param name 名称
 */
export function Inject(name?: string | symbol, options: IInjectOptions = {}) {
  return (target: any, member: string | symbol) => {
    if (!name) name = member;
    const injectInfo: IInjectInfo = { name, member, options };
    const injectList: IInjectInfo[] =
      Reflect.getMetadata(IOC_PROP_INJECT, target) || [];
    injectList.push(injectInfo);
    Reflect.metadata(IOC_PROP_INJECT, injectList)(target);
  };
}

/**
 * 获取属性注入信息
 * @param target 类型
 */
export function getPropInjectInfos(target: any) {
  const list = Reflect.getMetadata(IOC_PROP_INJECT, target) || [];
  return list as IInjectInfo[];
}
