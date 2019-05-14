import * as globby from "globby";
import { ILoader, LoadPattern } from "./ILoader";

/**
 * 资源加载器基类
 */
export class LoaderBase<T> implements ILoader {

  /**
   * 通过 pattern 声明一个加载器实例
   * @param root 根路径
   */
  constructor(protected pattern: LoadPattern) { }

  /**
   * 加载指定的模块
   * @param pattern 匹配模式（glob 语法）
   */
  public async load<T>(app: any) {
    const files = await globby(this.pattern, { cwd: app.root });
    const list: T[] = [];
    files.forEach(file => {
      const types = require(file);
      Object.keys(types).forEach(name => list.push(types[name]));
    });
  }

}