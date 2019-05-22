const oneport = require("oneport");

/**
 * 获取一个可用端口
 */
export function acquire() {
  return new Promise<number>((resolve, reject) =>
    oneport.acquire((err: Error, port: number) =>
      err ? reject(err) : resolve(port)
    )
  );
}
