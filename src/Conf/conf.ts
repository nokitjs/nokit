import { inject, InjectTypes } from "../IoC";

export function config(path: string) {
  return inject(`$config.${path}`, { type: InjectTypes.Value });
}