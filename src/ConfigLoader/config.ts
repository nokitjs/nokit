import { CONFIG_KEY } from "./constants";
import { createInjectValueGetter } from "../IoCLoader/InjectGetter";
import { inject } from "../IoCLoader";

/**
 * 向 service 或 controller 注入配置
 * @param path 配置项的 JSON Path
 */
export function config(path: string) {
  return inject(path, { getter: createInjectValueGetter(CONFIG_KEY) });
}
