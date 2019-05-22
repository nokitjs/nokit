import { provider, IProviderOptions } from "../IoCLoader";

/**
 * 模型选项
 */
export interface IModelOptions extends IProviderOptions {}

/**
 * 模型注解
 * @param name 模型名称（用于 inject）
 * @param options 选项
 */
export function model(name: string | symbol, options?: IModelOptions) {
  return provider(name, options);
}
