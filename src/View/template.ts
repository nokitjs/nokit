import { inject, InjectTypes } from "../IoC";

/**
 * 或 controller 注入渲染器
 * @param path 配置项的 JSON Path
 */
export function template(path: string) {
  return inject(`$views.${path}`, { type: InjectTypes.Value });
}