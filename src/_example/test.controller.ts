import { controller, get } from "../";
import { inject } from "../";

@controller('/test')
export class Test {

  @inject('test1')
  service: any;

  @get('/say')
  say() {
    return JSON.stringify(this.service || 'test');
  }

}