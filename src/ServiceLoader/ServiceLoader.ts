import { IoCLoader } from "../IoCLoader";

/**
 * service 加载器
 */
export class ServiceLoader<T = any> extends IoCLoader<T> {
  async load() {
    await super.load();
    this.app.logger.info("Service ready");
  }
}
