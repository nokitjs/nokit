import { controller, get, inject, param, query, render } from "../../";

@controller("/")
export class TestController {
  @inject("test1")
  service: any;

  @get("/say/:name")
  @render("index")
  say(@query("message") msg: string, @param("name") name: string) {
    return { name, msg };
  }
}
