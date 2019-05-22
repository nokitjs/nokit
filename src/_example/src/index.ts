import { Application } from "../..";
import { resolve } from "path";

const application = new Application({
  root: resolve(__dirname, "../")
});
application.run().catch(err => console.error(err));
