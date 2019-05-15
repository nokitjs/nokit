import * as globby from "globby";
import { ILoader } from "./ILoader";
import { IApplication } from "../Application";

/**
 * 资源加载器基类
 */
export abstract class AbstractLoader<T> implements ILoader {

  /**
   * 通过 pattern 声明一个加载器实例
   * @param root 根路径
   */
  constructor(protected pattern: string | string[]) { }

  /**
   * 执行加载
   * @param app 全局应用程序实例
   */
  public async load<T>(app: IApplication) {
    const { root } = app.options;
    const files = await globby(this.pattern, { cwd: root });
    const list: T[] = [];
    files.forEach(file => {
      const types = require(file);
      Object.keys(types).forEach(name => list.push(types[name]));
    });
  }

}