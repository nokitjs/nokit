import { AbstractLoader } from "../AbstractLoader";
import { IApplication } from "../Application";

/**
 * Setup 函数
 */
export type ISetupFunction = (app?: IApplication) => Promise<any> | any;

/**
 * Setup 加载器
 */
export class SetupLoader extends AbstractLoader<ISetupFunction> {
  /**
   * 执行加载
   */
  async load() {
    await super.load();
    await Promise.all(
      this.content.map(async func => {
        const value = await func(this.app);
        this.container.registerValue(func.name, value);
      })
    );
  }
}
