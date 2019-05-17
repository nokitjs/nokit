import { IContainer } from '../IoC/IContainer';
import { IInjectInfo, inject, InjectTypes } from '../IoC';
import { isFunction } from 'util';

const { getByPath } = require('ntils');

/**
 * 生成渲染函数注入 getter
 * @param container 容器实例
 * @param info 注入信息
 * @param instance 目标实例
 */
function createGetter(container: IContainer, info: IInjectInfo, instance: any) {
  const originMember = instance[info.member];
  const render = getByPath(container.values, info.name);
  if (!originMember || !isFunction(originMember)) return () => render;
  return () => (...args: any[]) => render(originMember(...args));
}

/**
 * 或 controller 注入渲染器
 * @param path 配置项的 JSON Path
 */
export function render(path: string) {
  const type = InjectTypes.Value;
  return inject(`$views.${path}`, { type, createGetter });
}