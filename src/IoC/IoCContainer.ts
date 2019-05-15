import { getProviderName } from "./provider";
import { IInjectInfo, getPropInjectInfos } from "./inject";

/**
 * IoC 容器 
 */
export class IoCContainer {

  /**
   * 所有已注册的类型
   */
  public types: { [name: string]: any } = {};

  /**
   * 在 IoC 容器中注册一组件类型
   * @param types 类型数组
   */
  public register(types: any[]) {
    types.forEach(type => {
      const info = getProviderName(type);
      if (!info || !info.name) return;
      if (this.types[info.name]) {
        throw new Error(`Provider name is duplicated: ${info.name}`);
      }
      this.types[info.name] = type;
    });
  }

  /**
   * 通过类型名称创建一个实例
   * @param name 已注册的类型名称
   */
  public createInstance<T>(name: string) {
    if (!name) return null;
    const Type = this.types[name];
    if (!Type) return null;
    const instance = new Type();
    const propInjectInfos = getPropInjectInfos(instance);
    propInjectInfos.forEach((info: IInjectInfo) => {
      delete instance[info.member];
      let refInstance: any;
      Object.defineProperty(instance, info.member, {
        enumerable: true,
        get: () => {
          if (!refInstance) refInstance = this.createInstance(info.provider);
          return refInstance;
        }
      });
    });
    return instance as T;
  }

}

export const container = new IoCContainer();