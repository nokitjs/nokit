import {
  config,
  controller,
  get,
  inject,
  param,
  query,
  template
} from '../../';

@controller('/test')
export class TestController {

  @inject('test1')
  service: any;

  @config('db')
  dbConf: any;


  @template('index')
  renderIndex: Function;

  @get('/say/:name')
  say(
    @query('message') msg: string,
    @param("name") name: string
  ) {
    return this.renderIndex({ name, msg });
  } 

} 