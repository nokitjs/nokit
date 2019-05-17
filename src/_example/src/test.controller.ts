import {
  config,
  controller,
  get,
  inject,
  param,
  query,
  render
} from '../../';

@controller('/test')
export class TestController {

  @inject('test1')
  service: any;

  @config('db')
  dbConf: any;

  @render('index')
  renderIndex: Function;

  @get('/say/:name')
  @render('index')
  say(
    @query('message') msg: string,
    @param("name") name: string
  ) {
    return { name, msg };
  }

} 