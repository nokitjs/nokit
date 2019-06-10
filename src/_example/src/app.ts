import { Application } from "../..";

new Application()
  .launch()
  .then(({ app, port }) => {
    app.logger.info("Running:", `http://localhost:${port}`);
  })
  .catch(err => {
    throw err;
  });
