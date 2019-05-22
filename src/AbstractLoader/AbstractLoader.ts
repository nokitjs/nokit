import * as globby from "globby";
import { IApplication } from "../Application/IApplication";
import { ILoader } from "./ILoader";
import { ILoaderOptions } from "./ILoaderOptions";
import { resolve, extname } from "path";
import { isArray } from "util";

/**
 * 资源加载器抽象基类
 */
export abstract class AbstractLoader<T = any> implements ILoader<T> {
  /**
   * 通过 path 声明一个加载器实例
   * @param options 路径或匹配表达式
   */
  constructor(protected app: IApplication, protected options: ILoaderOptions) {
    this.options = { ...options };
  }

  /**
   * 已加载的资源或类型列表
   */
  protected content: T[] = [];

  /**
   * 规范化匹配一个表达式字符串
   * @param patterns 匹配表达式
   */
  private normalizePattern(pattern: string): string {
    const ext = "{ts,js}";
    const src = extname(__filename) === ".ts" ? "src" : "lib";
    return pattern.replace("{src}", src).replace("{ext}", ext);
  }

  /**
   * 规范化匹配表达式字符串
   * @param patterns 匹配表达式
   */
  private normalizePatterns(patterns: string | string[]): string | string[] {
    return isArray(patterns)
      ? patterns.map((pattern: string) => this.normalizePattern(pattern))
      : this.normalizePattern(patterns);
  }

  /**
   * 获取匹配的文件
   * @param patterns 匹配表达式
   * @param options 匹配选项
   */
  protected glob(
    patterns: string | string[],
    options?: globby.GlobbyOptions
  ): Promise<string[]> {
    return globby(this.normalizePatterns(patterns), options);
  }

  /**
   * 加载相关的内容
   * @param app 全局应用程序实例
   */
  public async load<T>() {
    const { root } = this.app.options;
    const { path } = this.options;
    const files = await this.glob(path, { cwd: root });
    files.forEach(file => {
      const types = require(resolve(root, file));
      Object.keys(types).forEach(name => this.content.push(types[name]));
    });
  }
}
