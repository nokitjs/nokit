import { IoCLoader } from "../IoCLoader";

/**
 * 模型加载器
 */
export class ModelLoader<T = any> extends IoCLoader<T> {
  async load() {
    await super.load();
    this.app.logger.info("Model loaded");
  }
}
