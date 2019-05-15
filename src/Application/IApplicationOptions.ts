import { ILoader } from "../Loader";

/**
 * 全局应用类选项接口
 */
export interface IApplicationOptions {
  root?: string;
  port?: number;
  loaders?: ILoader<any>[];
}