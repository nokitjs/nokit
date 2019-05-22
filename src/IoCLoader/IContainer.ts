export interface IEntity {
  type: symbol;
  value: any;
}

export interface IContainer {
  /**
   * 所有已注册的可注入实体
   */
  readonly entities: any;

  /**
   * 向容器注册实体(类型 Array 或值 Map)
   * @param types 类型
   */
  register(entities: any[] | any): void;

  /**
   * 向容器注册实体类（Array）
   * @param types 实体类 Array
   */
  registerTypes(types: any[]): void;

  /**
   * 向容器注册一个实体类
   * @param name 实例名称
   * @param type 实体类
   */
  registerType(name: string | symbol, type: any): void;

  /**
   * 向容器注册实体值
   * @param values 实体值 map
   */
  registerValues(values: any): void;

  /**
   * 向容器注册一个实体值
   * @param name 实例名称
   * @param value 实体值
   */
  registerValue(name: string | symbol, value: any): void;

  /**
   * 通过类型名称创建一个实例
   * @param name 已注册的类型名称
   */
  get<T>(name: string | symbol): T;

  /**
   * 在实例上应用注入
   * @param instance
   */
  inject(instance: any): void;
}
