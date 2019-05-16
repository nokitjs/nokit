import { inject, provider } from '../..';

@provider("test1")
export class Test1Service {
  name = 'I am Test1';
  @inject('test2')
  test2: any;
}

@provider("test2")
export class Test2Service {
  name = "I am Test2";
}