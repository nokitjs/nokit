import * as globby from "globby";
import { ILoader } from "./ILoader";
import { IApplication } from "../Application/IApplication";
import { resolve } from "path";

/**
 * 资源加载器基类
 */
export abstract class AbstractLoader<T> implements ILoader<T> {

  /**
   * 通过 pattern 声明一个加载器实例
   * @param root 根路径
   */
  constructor(protected pattern: string | string[]) { }

  /**
   * 已加载的资源或类型列表
   */
  public list: T[] = [];

  /**
   * 执行加载
   * @param app 全局应用程序实例
   */
  public async load<T>(app: IApplication) {
    const { root } = app.options;
    const files = await globby(this.pattern, { cwd: root });
    files.forEach(file => {
      const types = require(resolve(root, file));
      Object.keys(types).forEach(name => this.list.push(types[name]));
    });
  }

}