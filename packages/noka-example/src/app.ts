import { Application } from "noka";

const application = new Application();

application
  .launch()
  .then(({ port }) => {
    application.logger.warn("Root:", application.root);
    application.logger.warn("Running:", `[ http://localhost:${port} ]`);
  })
  .catch(err => console.error(err));
