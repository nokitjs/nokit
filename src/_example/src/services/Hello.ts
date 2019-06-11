import { Inject, Provider } from "../../..";
import { Config } from "../../../ConfigLoader";

@Provider("test1")
export class Test1Service {
  name = "I am Test1";

  @Inject("test2")
  test2: any;

  @Inject()
  conn: any;
}

@Provider("test2")
export class Test2Service {
  name = "I am Test2";

  @Inject("db")
  db: any;

  @Config("aaa")
  conf: any;

  find(opts: any) {
    this.db.find(opts);
  }
}
