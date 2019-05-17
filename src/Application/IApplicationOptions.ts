import { ILoader } from "../Loader";

/**
 * 全局应用类选项接口
 */
export interface IApplicationOptions {

  /**
   * 应用的根目录（默认为当前工作目录）
   */
  root?: string;

  /**
   * 应用监听端口（默认自动选取一个可用端口）
   */
  port?: number;

  /**
   * 附加到应用实例的 loaders
   */
  loaders?: ILoader<any>[];

}