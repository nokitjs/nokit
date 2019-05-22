import { IContainer } from "./IContainer";
import { IInjectInfo } from "./IInjectInfo";

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
 * 默认的实体 Getter 函数
 * @param options 选项
 */
export function defaultInjectGetter(options: IInjectGetterOptions) {
  const { container, info } = options;
  return container.get(info.name);
}
