import { ControllerLoader } from "../ControllerLoader";
import { ILoaderInfoMap } from "../AbstractLoader";
import { InfoLoader } from "../InfoLoader";
import { ServiceLoader } from "../ServiceLoader";
import { SetupLoader } from "../SetupLoader";
import { StaticLoader } from "../StaticLoader";
import { ViewLoader } from "../ViewLoader";

export const builtLoaders: ILoaderInfoMap = {
  info: {
    loader: InfoLoader
  },
  setup: {
    loader: SetupLoader,
    options: { path: "./{src}/setups/**/*.{ext}" }
  },
  model: {
    loader: ServiceLoader,
    options: { path: "./{src}/models/**/*.{ext}" }
  },
  service: {
    loader: ServiceLoader,
    options: { path: "./{src}/services/**/*.{ext}" }
  },
  controller: {
    loader: ControllerLoader,
    options: { path: "./{src}/controllers/**/*.{ext}" }
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
