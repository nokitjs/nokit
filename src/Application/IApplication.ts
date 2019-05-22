import * as Koa from "koa";
import * as Router from "koa-router";
import { Container } from "../IoCLoader";
import { IApplicationOptions } from "./IApplicationOptions";

/**
 * 全局应用接口定义
 */
export interface IApplication {
  /**
   * 应用选项（实例化参数）
   */
  options: IApplicationOptions;

  /**
   * 应用内部 server 实例（Koa）
   */
  server: Koa;

  /**
   * 应用 Ioc 容器实例
   */
  container: Container;

  /**
   * 应用的根路由实例
   */
  router: Router;
}
