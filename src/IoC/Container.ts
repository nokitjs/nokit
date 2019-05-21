import { getProviderInfo } from "./provider";
import { getPropInjectInfos } from "./inject";
import { IContainer } from "./IContainer";
import { IOC_SINGLETON } from "./constants";
import { IInjectInfo } from "./IInjectInfo";
import { injectTypeGetter } from "./InjectGetter";


/**
 * IoC 容器 
 */
export class Container implements IContainer {

  /**
   * 所有已注册的可注入类型
   */
  public types: { [name: string]: any } = {};

  /**
   * 所有已注册的可注入值
   */
  public values: any = {};

  /**
   * 在 IoC 容器中注册一组件类型
   * @param types 类型数组
   */
  public register(types: any[]) {
    types.forEach(type => {
      const info = getProviderInfo(type);
      if (!info || !info.name) return;
      if (this.types[info.name]) {
        throw new Error(`Provider name is duplicated: ${info.name}`);
      }
      this.types[info.name] = type;
    });
  }

  /**
   * 添加 values
   * @param values 要添加的 values
   */
  public registerValues(values: any) {
    Object.assign(this.values, values);
  }

  /**
   * 在实例上应用注入 
   * @param instance 
   */
  public injectInstance(instance: any) {
    const container = this;
    const propInjectInfos = getPropInjectInfos(instance);
    propInjectInfos.forEach((info: IInjectInfo) => {
      const getter = (info.options && info.options.getter) || injectTypeGetter;
      const cacheKey = Symbol(String(info.member));
      const originValue = instance[info.member];
      delete instance[info.member];
      Object.defineProperty(instance, info.member, {
        enumerable: true, get: () => {
          if (!(cacheKey in instance)) {
            instance[cacheKey] = getter({ container, info, originValue });
          }
          return instance[cacheKey];
        },
      });
    });
  }

  /**
   * 通过类型名称创建一个实例
   * @param name 已注册的类型名称
   */
  public createInstance<T>(name: string) {
    if (!name) return null;
    const type = this.types[name];
    if (!type) return null;
    if (type[IOC_SINGLETON]) return type[IOC_SINGLETON];
    const instance = new type();
    this.injectInstance(instance);
    const info = getProviderInfo(type);
    if (info && info.options && info.options.singleton) {
      type[IOC_SINGLETON] = instance;
    }
    return instance as T;
  }

}