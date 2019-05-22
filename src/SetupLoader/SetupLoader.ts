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
  async load(app: IApplication) {
    await super.load(app);
    await Promise.all(
      this.content.map(async func => {
        const value = await func(app);
        app.container.registerValue(func.name, value);
      })
    );
  }
}
