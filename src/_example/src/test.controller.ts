import { controller, get, inject, config } from "../../";
import { query, params } from "../../Controller";

@controller('/')
export class Test {

  @inject('test1')
  service: any;

  @config('db')
  dbConf: any;

  @get('/say/:name')
  say(
    @query('message') msg: string,
    @params("name") name: string
  ) {
    return { name, msg };
  }

} 