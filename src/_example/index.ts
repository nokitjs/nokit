import { Application, container } from "../";
import { Test2Service } from "./test.service";

(async () => {

  console.time('start');
  const app = new Application();
  await app.run();
  console.timeEnd('start');

  console.log('-'.repeat(80));
  console.time('createInstance');
  const instance = container.createInstance<Test2Service>('test2');
  console.timeEnd('createInstance');
  console.log(instance);

})();