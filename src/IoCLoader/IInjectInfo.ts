import { IInjectOptions } from "./IInjectOptions";

/**
 * 注入信息
 */
export interface IInjectInfo {
  name: string | symbol;
  member: string | symbol;
  options: IInjectOptions;
}
