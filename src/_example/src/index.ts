import { Application } from "../..";
import { resolve } from "path";

const application = new Application({
  port: 8080,
  root: resolve(__dirname, '../'),
  loaders: []
});
application.run();