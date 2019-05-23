import { Application } from "../..";

const application = new Application();
application
  .launch()
  .then(({ port }) => console.info("Running:", `http://localhost:${port}`))
  .catch(err => console.error(err));
