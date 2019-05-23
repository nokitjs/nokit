import { pkg } from "./utils";

const console = require("console3");
const utils = require("ntils");
const prefix = `[${pkg.displayName}]`;

export function time() {
  const time = utils.formatDate(new Date(), "hh:mm:ss");
  console.write(console.colors.blue(`[${time}] `));
  return true;
}

export function log(...args: any[]) {
  return time() && console.log(prefix, ...args);
}

export function info(...args: any[]) {
  return time() && console.info(prefix, ...args);
}

export function warn(...args: any[]) {
  return time() && console.warn(prefix, ...args);
}

export function error(...args: any[]) {
  return time() && console.error(prefix, ...args);
}
