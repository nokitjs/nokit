import { Application } from "../";
import { Test2Service } from "./test.service";
import { IApplication } from "../Application";

(async () => {

  console.time('start');
  const app = new Application({
    loaders: [
      {
        async load(app: IApplication) {
        }
      }
    ]
  });
  
  await app.run();
  console.timeEnd('start');

  console.log('-'.repeat(80));
  console.time('createInstance');
  const instance = app.container.createInstance<Test2Service>('test2');
  console.timeEnd('createInstance');
  console.log(instance);

})();