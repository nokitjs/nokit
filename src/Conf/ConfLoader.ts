import { AbstractLoader } from '../Loader';
import { IApplication } from '../Application';
import { resolve } from 'path';

const confman = require("confman");

/**
 * 配置加载器
 */
export class ConfLoader<T> extends AbstractLoader<T> {
  public async load(app: IApplication) {
    const { root } = app.options;
    const configFile = resolve(root, this.pattern as string);
    const $config = confman.load(configFile);
    app.container.appendValues({ $config });
  }
}