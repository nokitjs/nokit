import { inject } from '../IoC';
import { isFunction } from 'util';
import { IInjectGetterOptions } from '../IoC/InjectGetter';
import { VIEW_KEY } from './constants';

const { getByPath } = require('ntils');

function renderGetter(options: IInjectGetterOptions) {
  const { container, info, originValue } = options;
  const values = container.values[VIEW_KEY];
  const render = getByPath(values, info.name);
  return (!originValue || !isFunction(originValue)) ?
    render : (...args: any[]) => render(originValue(...args));
}

/**
 * 或 controller 注入渲染器
 * @param path 配置项的 JSON Path
 */
export function render(path: string) {
  return inject(path, { getter: renderGetter });
}