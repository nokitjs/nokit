import { AbstractLoader } from '../Loader';
import { IApplication } from '../Application';
import { resolve } from 'path';

const confman = require("confman");

/**
 * 配置加载器
 */
export class ConfigLoader<T> extends AbstractLoader<T> {

  /**
   * 加载应用配置
   * @param app 应用实例
   */
  public async load(app: IApplication) {
    const { root } = app.options;
    const configFile = resolve(root, this.path as string);
    const $config = confman.load(configFile);
    app.container.appendValues({ $config });
  }

}