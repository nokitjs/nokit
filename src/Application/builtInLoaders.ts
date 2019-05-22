import { ControllerLoader } from "../ControllerLoader";
import { ILoaderInfo } from "../AbstractLoader/ILoaderInfo";
import { InfoLoader } from "../InfoLoader";
import { ServiceLoader } from "../ServiceLoader";
import { StaticLoader } from "../StaticLoader";
import { ViewLoader } from "../ViewLoader";
import { SetupLoader } from "../SetupLoader";

export const builtLoaders: ILoaderInfo[] = [
  {
    name: "info",
    loader: InfoLoader,
    options: null
  },
  {
    name: "setup",
    loader: SetupLoader,
    options: { path: "./src/setups/**/*.{ts,js}" }
  },
  {
    name: "service",
    loader: ServiceLoader,
    options: { path: "./src/services/**/*.{ts,js}" }
  },
  {
    name: "controller",
    loader: ControllerLoader,
    options: { path: "./src/controllers/**/*.{ts,js}" }
  },
  {
    name: "view",
    loader: ViewLoader,
    options: { path: "./views" }
  },
  {
    name: "static",
    loader: StaticLoader,
    options: { path: "./assets" }
  }
];
