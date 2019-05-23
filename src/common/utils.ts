const utils = require("ntils");

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
