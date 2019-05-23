import * as Koa from "koa";
import * as Router from "koa-router";
import { Container } from "../IoCLoader";

/**
 * 全局应用接口定义
 */
export interface IApplication {
  /**
   * 当前环境标识（取值 NOKA_ENV || NODE_ENV）
   */
  readonly env: string;

  /**
   * 应用根目录
   */
  readonly root: string;

  /**
   * 应用配置
   */
  readonly config: any;

  /**
   * 应用内部 server 实例（Koa）
   */
  readonly server: Koa;

  /**
   * 应用 Ioc 容器实例
   */
  readonly container: Container;

  /**
   * 应用的根路由实例
   */
  readonly router: Router;
}
