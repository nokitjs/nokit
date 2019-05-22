import { inject } from "../IoCLoader";
import { isFunction } from "util";
import { IInjectGetterOptions } from "../IoCLoader/InjectGetter";
import { VIEWS_ENTITY_KEY } from "./constants";

const { getByPath } = require("ntils");

export function renderInjectGetter(options: IInjectGetterOptions) {
  const { container, info, originValue, instance } = options;
  const views = container.get(VIEWS_ENTITY_KEY);
  const render = getByPath(views, info.name);
  return !originValue || !isFunction(originValue)
    ? render
    : (...args: any[]) => render(originValue.call(instance, ...args));
}

/**
 * 或 controller 注入渲染器
 * @param path 配置项的 JSON Path
 */
export function render(path: string) {
  return inject(path, { getter: renderInjectGetter });
}
