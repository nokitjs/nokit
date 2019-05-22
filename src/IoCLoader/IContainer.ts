export interface IContainer {
  /**
   * 所有已注册的可注入类型
   */
  types: { [name: string]: any };

  /**
   * 所有已注册的可注入值
   */
  values: any;

  /**
   * 通过类型名称创建一个实例
   * @param name 已注册的类型名称
   */
  createInstance<T>(name: string): T;

  /**
   * 在实例上应用注入
   * @param instance
   */
  injectInstance(instance: any): void;
}
