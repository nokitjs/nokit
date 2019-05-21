import * as globby from 'globby';
import { IApplication } from '../Application/IApplication';
import { ILoader } from './ILoader';
import { ILoaderOptions } from './ILoaderOptions';
import { resolve } from 'path';

/**
 * 资源加载器抽象基类
 */
export abstract class AbstractLoader<T> implements ILoader<T> {

  /**
   * 通过 path 声明一个加载器实例
   * @param options 路径或匹配表达式
   */
  constructor(protected options: ILoaderOptions) {
    this.options = Object.assign({}, options);
  }

  /**
   * 已加载的资源或类型列表
   */
  protected content: T[] = [];

  /**
   * 执行加载
   * @param app 全局应用程序实例
   */
  public async load<T>(app: IApplication) {
    const { root } = app.options;
    const { path } = this.options;
    const files = await globby(path, { cwd: root });
    files.forEach(file => {
      const types = require(resolve(root, file));
      Object.keys(types).forEach(name => this.content.push(types[name]));
    });
  }

}