import { controller, get, inject, param, render, session } from "../../..";

@controller("/")
export class HelloController {
  @inject("test1")
  service: any;

  @get("/say/:name")
  @render("index")
  say(@param("name") name: string, @session() session: any) {
    session.count = session.count || 0;
    session.count++;
    name += session.count;
    return { name };
  }
}
