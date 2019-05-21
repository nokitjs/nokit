import { AbstractLoader } from '../Loader';
import { CONFIG_KEY } from './constants';
import { IApplication } from '../Application/IApplication';
import { resolve } from 'path';

const confman = require("confman");

/**
 * 配置加载器
 */
export class ConfigLoader<T = any> extends AbstractLoader<T> {

  /**
   * 加载应用配置
   * @param app 应用实例
   */
  public async load(app: IApplication) {
    const { root } = app.options;
    const { path } = this.options;
    const configFile = resolve(root, path);
    const configObject = confman.load(configFile);
    app.container.registerValues({ [CONFIG_KEY]: configObject });
  }

}