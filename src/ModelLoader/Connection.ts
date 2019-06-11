import { IInjectGetterOptions } from "../IoCLoader/InjectGetter";
import { Inject } from "../IoCLoader/Inject";
import { MODEL_CONN_ENTITY_KEY } from "./constants";

/**
 * 配置注入 Getter 函数
 * @param options 注入选项
 */
export function configInjectGetter(options: IInjectGetterOptions) {
  const { container, info } = options;
  const connections: any[] = container.get(MODEL_CONN_ENTITY_KEY);
  return (
    connections.find((item: any) => info.name === item.name) || connections[0]
  );
}

/**
 * 向 service 或 controller 注入配置
 * @param name 配置项的 JSON Path
 */
export function Connection(name: string) {
  return Inject(name, { getter: configInjectGetter });
}
