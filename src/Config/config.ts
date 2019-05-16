import { inject, InjectTypes } from "../IoC";

/**
 * 向 service 或 controller 注入配置
 * @param path 配置项的 JSON Path
 */
export function config(path: string) {
  return inject(`$config.${path}`, { type: InjectTypes.Value });
}