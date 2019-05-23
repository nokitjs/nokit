import { Application } from "../..";

new Application()
  .launch()
  .then(({ port }) => console.info("Running:", `http://localhost:${port}`))
  .catch(err => console.error(err));
