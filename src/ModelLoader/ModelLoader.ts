import { createConnections } from "typeorm";
import { IoCLoader } from "../IoCLoader";
import { isArray } from "util";
import { MODEL_CONN_ENTITY_KEY } from "./constants";
export * from "typeorm";

/**
 * 模型加载器
 */
export class ModelLoader<T = any> extends IoCLoader<T> {
  private get defaultConnection() {
    return {
      type: "sqlite",
      database: this.normalizePattern("./data/store.db"),
      synchronize: true,
      logging: false,
      entities: this.normalizePatterns([this.options.path])
    };
  }

  private wrapConnection(connection: any) {
    return { ...this.defaultConnection, ...connection };
  }

  async load() {
    await super.load();
    const { connection = {} } = this.options;
    const items = isArray(connection)
      ? connection.map(item => this.wrapConnection(item))
      : [this.wrapConnection(connection)];
    const connections = await createConnections(items);
    this.app.container.registerValue(MODEL_CONN_ENTITY_KEY, connections);
    this.app.logger.info("Model ready");
  }
}
