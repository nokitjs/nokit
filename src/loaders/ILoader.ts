import { IApplication } from "../Application/IApplication";

/**
 * 加载资源的匹配模式字符串
 */
export type LoadPattern = string | string[];

/**
 * 加载器接口定义
 */
export interface ILoader {
  load<T>(app: IApplication): Promise<void>;
}
