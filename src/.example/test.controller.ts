import { controller, get } from "../";

@controller('/test')
export class Test {

  @get('/say')
  say() {

  }

}