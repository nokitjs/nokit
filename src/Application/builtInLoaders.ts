import { ConfigLoader } from "../ConfigLoader";
import { ControllerLoader } from "../ControllerLoader";
import { HeadersLoader } from "../HeadersLoader";
import { ILoaderInfoMap } from "../AbstractLoader";
import { LoggerLoader } from "../LoggerLoader";
import { ModelLoader } from "../ModelLoader";
import { ServiceLoader } from "../ServiceLoader";
import { SessionLoader } from "../SessionLoader";
import { SetupLoader } from "../SetupLoader";
import { StaticLoader } from "../StaticLoader";
import { ViewLoader } from "../ViewLoader";
import { BodyLoader } from "../BodyLoader";

export const builtLoaders: ILoaderInfoMap = {
  config: {
    loader: ConfigLoader,
    options: { path: "./configs/config" }
  },
  logger: {
    loader: LoggerLoader
  },
  headers: {
    loader: HeadersLoader
  },
  setup: {
    loader: SetupLoader,
    options: { path: "./:src/setups/**/*:ext" }
  },
  body: {
    loader: BodyLoader
  },
  model: {
    loader: ModelLoader,
    options: { path: "./:src/models/**/*:ext" }
  },
  service: {
    loader: ServiceLoader,
    options: { path: "./:src/services/**/*:ext" }
  },
  session: {
    loader: SessionLoader
  },
  controller: {
    loader: ControllerLoader,
    options: { path: "./:src/controllers/**/*:ext" }
  },
  view: {
    loader: ViewLoader,
    options: { path: "./views" }
  },
  static: {
    loader: StaticLoader,
    options: { path: "./assets" }
  }
};
