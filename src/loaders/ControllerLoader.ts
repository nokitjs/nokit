import { LoadPattern } from "./ILoader";
import { IoCLoader } from "./IOCLoader";

export class ControllerLoader<T> extends IoCLoader<T> {
  public async load<T>(pattern: LoadPattern) {
    const list = await super.load<T>(pattern);
    return list;
  }
}