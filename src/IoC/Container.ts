import { getProviderName } from "./provider";
import { IInjectInfo, getPropInjectInfos, InjectTypes } from "./inject";
import { IContainer } from "./IContainer";

const { getByPath } = require('ntils');

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
      const info = getProviderName(type);
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
  public appendValues(values: any) {
    Object.assign(this.values, values);
  }

  /**
   *  创建 Type 注入 getter
   * @param info 注入信息
   */
  protected createTypeGetter(info: IInjectInfo) {
    let instance: any;
    return () => {
      if (!instance) instance = this.createInstance(info.name);
      return instance;
    };
  }

  /**
   * 创建 Value 注入 getter
   * @param info 注入信息
   */
  protected createValueGetter(info: IInjectInfo) {
    return () => getByPath(this.values, info.name);
  }

  /**
   * 创建注入的 getter
   * @param info 注入信息
   */
  protected createInjectGetter(info: IInjectInfo) {
    return info.options && info.options.type === InjectTypes.Value ?
      this.createValueGetter(info) :
      this.createTypeGetter(info);
  }

  /**
   * 在实例上应用注入 
   * @param instance 
   */
  public injectInstance(instance: any) {
    const propInjectInfos = getPropInjectInfos(instance);
    propInjectInfos.forEach((info: IInjectInfo) => {
      const getter = info.options && info.options.createGetter ?
        info.options.createGetter(this, info, instance) :
        this.createInjectGetter(info);
      delete instance[info.member];
      Object.defineProperty(instance, info.member, {
        enumerable: true, get: getter,
      });
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
    this.injectInstance(instance);
    return instance as T;
  }

}