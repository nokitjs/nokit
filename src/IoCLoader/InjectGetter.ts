import { IContainer } from "./IContainer";
import { IInjectInfo } from "./IInjectInfo";

const { getByPath } = require("ntils");

/**
 * 用于获取注入值的 Getter 函数参数
 */
export interface IInjectGetterOptions {
  container: IContainer;
  info: IInjectInfo;
  originValue: any;
}

/**
 * 用于获取注入值的 Getter 函数
 */
export type IInjectGetter = (opitons: IInjectGetterOptions) => any;

/**
 * 注入类型实例的 Getter 函数
 * @param options 选项
 */
export function injectTypeGetter(options: IInjectGetterOptions) {
  const { container, info } = options;
  return container.createInstance(info.name);
}

/**
 * 注入普通 Value 的 Getter 函数
 * @param options 选项
 */
export function injectValueGetter(options: IInjectGetterOptions) {
  const { container, info } = options;
  return getByPath(container.values, info.name);
}

/**
 * 创建一个用于获取注入值的 Getter 函数
 * @param key 唯一 key
 */
export function createInjectValueGetter(key: symbol) {
  return (options: IInjectGetterOptions) => {
    const { container, info } = options;
    const values = container.values[key];
    if (values) return;
    return getByPath(values, info.name);
  };
}
