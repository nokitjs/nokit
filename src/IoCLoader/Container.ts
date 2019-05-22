import { getProviderInfo } from "./provider";
import { getPropInjectInfos } from "./inject";
import { IContainer, IEntity } from "./IContainer";
import { IOC_SINGLETON, IOC_ENTITY_CLS, IOC_ENTITY_OBJ } from "./constants";
import { IInjectInfo } from "./IInjectInfo";
import { defaultInjectGetter } from "./InjectGetter";

/**
 * IoC 容器类
 */
export class Container implements IContainer {
  /**
   * 所有已注册的可注入实体
   */
  public readonly entities: any = {};

  /**
   * 向容器中注册一个实体
   * @param name 注册名称
   * @param type 注册类型
   * @param value 注册实体
   */
  protected registerEntity(name: string | symbol, type: symbol, value: any) {
    if (this.entities[name]) {
      throw new Error(`Entity name is duplicated: ${String(name)}`);
    }
    this.entities[name] = { type, value };
  }

  /**
   * 向容器注册一个实体类
   * @param name 实例名称
   * @param type 实体类
   */
  registerType(name: string | symbol, type: any): void {
    this.registerEntity(name, IOC_ENTITY_CLS, type);
  }

  /**
   * 在 IoC 容器中注册一组件类型
   * @param types 类型数组
   */
  public registerTypes(types: any[]): void {
    types.forEach(type => {
      const info = getProviderInfo(type);
      if (!info || !info.name) return;
      this.registerType(info.name, type);
    });
  }

  /**
   * 向容器注册一个实体值
   * @param name 实例名称
   * @param value 实体值
   */
  registerValue(name: string | symbol, value: any): void {
    this.registerEntity(name, IOC_ENTITY_OBJ, value);
  }

  /**
   * 添加 values
   * @param map 要添加的 values
   */
  public registerValues(map: any): void {
    Object.keys(map).forEach((name: string) => {
      this.registerValue(name, map[name]);
    });
    Object.getOwnPropertySymbols(map).forEach((name: symbol) => {
      this.registerValue(name, map[name]);
    });
  }

  /**
   * 向容器注册实体(类型 Array 或值 Map)
   * @param types 类型
   */
  public register(entities: any[] | any): void {
    return entities instanceof Array
      ? this.registerTypes(entities)
      : this.registerValues(entities);
  }

  /**
   * 在实例上注入一个属性
   * @param instance 将要执行注入的实例
   * @param info 注入信息
   */
  private injectProp(instance: any, info: IInjectInfo) {
    const getter = (info.options && info.options.getter) || defaultInjectGetter;
    const cacheKey = Symbol(String(info.member));
    const originValue = instance[info.member];
    delete instance[info.member];
    const enumerable = true,
      get = () => {
        if (cacheKey in instance) return instance[cacheKey];
        instance[cacheKey] = getter({ container: this, info, originValue });
        return instance[cacheKey];
      };
    Object.defineProperty(instance, info.member, { enumerable, get });
  }

  /**
   * 在实例上应用注入
   * @param instance
   */
  public inject(instance: any) {
    const propInjectInfos = getPropInjectInfos(instance);
    propInjectInfos.forEach((info: IInjectInfo) =>
      this.injectProp(instance, info)
    );
  }

  /**
   * 通过类型名称创建一个实例
   * @param name 已注册的类型名称
   */
  public get<T = any>(name: string | symbol) {
    if (!name) return;
    const entity: IEntity = this.entities[name];
    if (!entity) return;
    if (entity.type !== IOC_ENTITY_CLS) return entity.value as T;
    const type = entity.value;
    if (!type) return;
    if (type[IOC_SINGLETON]) return type[IOC_SINGLETON] as T;
    const instance = new type();
    this.inject(instance);
    const info = getProviderInfo(type);
    if (info && info.options && info.options.singleton) {
      type[IOC_SINGLETON] = instance;
    }
    return instance as T;
  }
}
