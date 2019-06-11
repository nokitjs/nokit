import { CONFIG_ENTITY_KEY } from "./constants";
import { getByPath } from "../common/utils";
import { IInjectGetterOptions } from "../IoCLoader/InjectGetter";
import { Inject } from "../IoCLoader";

/**
 * 配置注入 Getter 函数
 * @param options 注入选项
 */
function configInjectGetter(options: IInjectGetterOptions) {
  const { container, info } = options;
  const configObject = container.get(CONFIG_ENTITY_KEY);
  return getByPath(configObject, String(info.name));
}

/**
 * 向 service 或 controller 注入配置
 * @param path 配置项的 JSON Path
 */
export function Config(path: string) {
  return Inject(path, { getter: configInjectGetter });
}
