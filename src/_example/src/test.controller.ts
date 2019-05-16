import { controller, get, inject, config } from "../../";

@controller('/')
export class Test {

  @inject('test1')
  service: any;

  @config('db')
  dbConf: any;

  @get('/say')
  say() {
    return this.dbConf || 'x';
  }

}