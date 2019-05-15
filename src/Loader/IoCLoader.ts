import { AbstractLoader } from "./AbstractLoader";
import { IApplication } from "../Application/IApplication";

/**
 * IoC 加载器
 */
export class IoCLoader<T> extends AbstractLoader<T> {
  public async load<T>(app: IApplication) {
    await super.load<T>(app);
    app.container.register(this.content);
  }
}