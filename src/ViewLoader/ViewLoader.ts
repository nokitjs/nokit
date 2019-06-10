import * as globby from "globby";
import { AbstractLoader } from "../AbstractLoader";
import { basename, resolve } from "path";
import { compile, Environment, FileSystemLoader } from "nunjucks";
import { existsSync, readFile } from "fs";
import { VIEWS_ENTITY_KEY } from "./constants";

/**
 * 读取模板路径
 * @param filename 模板路径
 */
export function readTemplate(filename: string) {
  return new Promise<string>((done, reject) => {
    readFile(filename, "utf8", (err, data) => {
      return err ? reject(err) : done(data);
    });
  });
}

/**
 * 静态资源 加载器
 */
export class ViewLoader<T = any> extends AbstractLoader<T> {
  /**
   * 加载所有视图
   */
  public async load() {
    const { path, extname = ".html" } = this.options;
    const viewRoot = resolve(this.root, path);
    if (!existsSync(viewRoot)) return;
    const files = await globby(`./**/*${extname}`, { cwd: viewRoot });
    const viewMap: any = {};
    const env = new Environment(new FileSystemLoader(viewRoot));
    await Promise.all(
      files.map(async file => {
        const text = await readTemplate(resolve(viewRoot, file));
        // @types/nunjucks 3.1.1 没有第三个 path 参数的类型定义
        const relativePath: any = file;
        const template = compile(text, env, relativePath);
        viewMap[basename(file, extname)] = (data: any) => template.render(data);
      })
    );
    this.container.registerValue(VIEWS_ENTITY_KEY, viewMap);
    this.app.logger.info("View ready");
  }
}
