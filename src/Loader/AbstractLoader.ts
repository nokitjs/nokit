import * as globby from "globby";
import { ILoader } from "./ILoader";
import { IApplication } from "../Application/IApplication";
import { resolve } from "path";

/**
 * 资源加载器抽象基类
 */
export abstract class AbstractLoader<T> implements ILoader<T> {

  /**
   * 通过 path 声明一个加载器实例
   * @param path 路径或匹配表达式
   */
  constructor(protected path: string | string[]) { }

  /**
   * 已加载的资源或类型列表
   */
  public content: T[] = [];

  /**
   * 执行加载
   * @param app 全局应用程序实例
   */
  public async load<T>(app: IApplication) {
    const { root } = app.options;
    const files = await globby(this.path, { cwd: root });
    files.forEach(file => {
      const types = require(resolve(root, file));
      Object.keys(types).forEach(name => this.content.push(types[name]));
    });
  }

}