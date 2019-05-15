import { AbstractLoader } from "./AbstractLoader";
import { IApplication } from "../Application/IApplication";
import { container } from "../IoC";

export class IoCLoader<T> extends AbstractLoader<T> {
  public async load<T>(app: IApplication) {
    await super.load<T>(app);
    container.register(this.list);
  }
}