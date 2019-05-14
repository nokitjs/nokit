import 'reflect-metadata'

export function fromContext(path: string) {
  return (target: any, name: string) =>
    Reflect.metadata('from-context', path)(target, name);
}