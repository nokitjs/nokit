import { provider } from "../";
import { inject } from "../IoC";

@provider("test1")
export class Test1Service {
  name = 'test1';
  @inject('test2')
  test2: any;
}

@provider("test2")
export class Test2Service {
  name = "test2";
  @inject('test1')
  test1: Test1Service;
}