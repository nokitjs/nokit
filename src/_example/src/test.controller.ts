import { controller, get, inject, config } from "../../";
import { query, param } from "../../Controller";

@controller('/')
export class TestController {

  @inject('test1')
  service: any;

  @config('db')
  dbConf: any;

  @get('/say/:name')
  say(
    @query('message') msg: string,
    @param("name") name: string
  ) {
    return { name, msg };
  }

} 