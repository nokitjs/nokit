const pkg = require("../../package.json");

/**
 * ENV 环境变量名
 */
export const ENV_NAME = `${pkg.displayName.toUpperCase()}_ENV`;

/**
 * 保留配置节，loader 不可用保留名称
 */
export const CONF_RESERVEDS = ["port", "loaders"];
