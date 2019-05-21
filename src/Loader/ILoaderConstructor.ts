import { ILoaderOptions } from "./ILoaderOptions";
import { ILoader } from "./ILoader";

/**
 * 加载器构造接口
 */
export interface ILoaderConstructor<T> {
  new(options: ILoaderOptions): ILoader<T>;
}
