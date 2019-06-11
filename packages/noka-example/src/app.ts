import { Application } from "noka";

const application = new Application();

application
  .launch()
  .then(({ port }) => {
    application.logger.info("Root:", application.root);
    application.logger.info("Running:", `http://localhost:${port}`);
  })
  .catch(err => console.error(err));
