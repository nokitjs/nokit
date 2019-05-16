import * as nunjucks from 'nunjucks';
import * as globby from "globby";
import { readFile } from "fs";
import { AbstractLoader } from '../Loader';
import { IApplication } from '../Application/IApplication';
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
    const viewRoot = resolve(root, this.path as string);
    const files = await globby('./**/*.nj', { cwd: viewRoot });
    const $views: any = {};
    await Promise.all(files.map(async (file) => {
      const text = await readTemplate(resolve(viewRoot, file));
      const template = nunjucks.compile(text);
      $views[trimTplName(file)] = (data: any) => template.render(data);
    }));
    app.container.appendValues({ $views });
  }

}