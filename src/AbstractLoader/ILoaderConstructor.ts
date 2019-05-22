import { ILoaderOptions } from "./ILoaderOptions";
import { ILoader } from "./ILoader";

/**
 * 加载器构造接口
 */
export type ILoaderConstructor<T = any> = new (
  options: ILoaderOptions
) => ILoader<T>;
