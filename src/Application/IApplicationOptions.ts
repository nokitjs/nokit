/**
 * 全局应用类选项接口
 */
export interface IApplicationOptions {
  /**
   * 应用根目录（默认为当前工作目录）
   */
  root?: string;

  /**
   * 应用端口（默认自动选取可用端口）
   */
  port?: number;
}
