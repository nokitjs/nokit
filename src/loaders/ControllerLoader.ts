import { IoCLoader } from "./IoCLoader";
import { IApplication } from "../Application";

export class ControllerLoader<T> extends IoCLoader<T> {
  public async load<T>(app: IApplication) {
    const list = await super.load<T>(app);
    return list;
  }
}