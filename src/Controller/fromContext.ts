import { CTL_FROM_CONTEXT } from './constants';

export function fromContext(path: string) {
  return (target: any, name: string) =>
    Reflect.metadata(CTL_FROM_CONTEXT, path)(target, name);
}