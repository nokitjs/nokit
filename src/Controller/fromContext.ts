import { CTL_FROM_CONTEXT } from './constants';

/**
 * 从 ctx 上获取内容
 * @param path JSON Path
 */
export function fromContext(path: string) {
  return (target: any, name: string) =>
    Reflect.metadata(CTL_FROM_CONTEXT, path)(target, name);
}