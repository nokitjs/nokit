const utils = require("ntils");

/**
 * 框架的 pkg 对象
 */
export const pkg = require("../../package.json");

/**
 * 通过路径从对象上获取值
 */
export function getByPath(obj: any, path: string) {
  return utils.getByPath(obj, path);
}

/**
 * 生成一个 UUID
 */
export function uuid(): string {
  return utils.newGuid();
}

/**
 * 合并两个对象
 * @param dst 目标对象
 * @param src 来源对象
 * @param igonres 忽略列表
 */
export function mix(dst: any, src: any, igonres?: string[]) {
  return utils.mix(dst, src, igonres);
}
