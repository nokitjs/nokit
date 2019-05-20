import * as globby from 'globby';
import { AbstractLoader } from '../Loader';
import { compile, Environment, FileSystemLoader } from 'nunjucks';
import { IApplication } from '../Application/IApplication';
import { readFile } from 'fs';
import { resolve } from 'path';

/**
 * 读取模板路径
 * @param filename 模板路径
 */
export function readTemplate(filename: string) {
  return new Promise<string>((done, reject) => {
    readFile(filename, 'utf8', (err, data) => {
      return err ? reject(err) : done(data);
    });
  });
}

/**
 * 修剪模板名称
 * @param filename 模板路径
 */
export function trimTplName(filename: string) {
  return filename.slice(0, filename.length - 3);
}

/**
 * 静态资源 加载器
 */
export class ViewLoader<T> extends AbstractLoader<T> {

  public async load(app: IApplication) {
    const { root } = app.options;
    const { path } = this.options;
    const viewRoot = resolve(root, path);
    const files = await globby('./**/*.nj', { cwd: viewRoot });
    const $views: any = {};
    const env = new Environment(new FileSystemLoader(viewRoot));
    await Promise.all(files.map(async (file) => {
      const text = await readTemplate(resolve(viewRoot, file));
      //@types/nunjucks 3.1.1 没有第三个 path 参数的类型定义
      const template = compile(text, env, file as any);
      $views[trimTplName(file)] = (data: any) => template.render(data);
    }));
    app.container.registerValues({ $views });
  }

}