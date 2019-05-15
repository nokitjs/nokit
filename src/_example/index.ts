import { Application } from "../";

const application = new Application({
  port: 8080,
  loaders: []
});
application.run();