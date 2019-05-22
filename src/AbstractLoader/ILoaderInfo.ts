import { ILoaderOptions } from "./ILoaderOptions";
import { ILoaderConstructor } from "./ILoaderConstructor";

export interface ILoaderInfo {
  name: string;
  loader?: ILoaderConstructor;
  options?: ILoaderOptions;
}
