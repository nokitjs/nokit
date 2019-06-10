export interface ILogger {
  /**
   * 输出 debug 日志
   * @param dataOrFormatter 输出内容或格式化字符串
   * @param args 插入参数
   */
  debug(dataOrFormatter: any, ...args: any[]): any;

  /**
   * 输出 info 日志
   * @param dataOrFormatter 输出内容或格式化字符串
   * @param args 插入参数
   */
  info(dataOrFormatter: any, ...args: any[]): any;

  /**
   * 输出 warn 日志
   * @param dataOrFormatter 输出内容或格式化字符串
   * @param args 插入参数
   */
  warn(dataOrFormatter: any, ...args: any[]): any;

  /**
   * 输出 error 日志
   * @param dataOrFormatter 输出内容或格式化字符串
   * @param args 插入参数
   */
  error(dataOrFormatter: any, ...args: any[]): any;
}
