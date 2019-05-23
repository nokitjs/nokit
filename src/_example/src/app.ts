import { Application } from "../..";

new Application({ port: 8080 })
  .launch()
  .then(({ port }) => console.info("Running:", `http://localhost:${port}`))
  .catch(err => console.error(err));
