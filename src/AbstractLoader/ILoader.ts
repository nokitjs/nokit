/**
 * 加载器接口定义
 */
export interface ILoader<T = any> {
  load<T>(): Promise<void>;
}
