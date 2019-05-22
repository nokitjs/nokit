import { IApplication } from "../Application/IApplication";

/**
 * 加载器接口定义
 */
export interface ILoader<T = any> {
  load<T>(app: IApplication): Promise<void>;
}
