import { ControllerLoader } from "../ControllerLoader";
import { ILoaderInfo } from "../AbstractLoader/ILoaderInfo";
import { InfoLoader } from "../InfoLoader";
import { ServiceLoader } from "../ServiceLoader";
import { StaticLoader } from "../StaticLoader";
import { ViewLoader } from "../ViewLoader";

export const builtLoaders: ILoaderInfo[] = [
  {
    name: "info",
    loader: InfoLoader,
    options: null
  },
  {
    name: "service",
    loader: ServiceLoader,
    options: { path: "./src/**/*.service.{ts,js}" }
  },
  {
    name: "controller",
    loader: ControllerLoader,
    options: { path: "./src/**/*.controller.{ts,js}" }
  },
  {
    name: "view",
    loader: ViewLoader,
    options: { path: "./views" }
  },
  {
    name: "static",
    loader: StaticLoader,
    options: { path: "./public" }
  }
];
