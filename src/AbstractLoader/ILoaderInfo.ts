import { ILoaderOptions } from "./ILoaderOptions";
import { ILoaderConstructor } from "./ILoaderConstructor";

export interface ILoaderInfo {
  loader: ILoaderConstructor;
  options?: ILoaderOptions;
}

export interface ILoaderInfoMap {
  [name: string]: ILoaderInfo | string;
}
