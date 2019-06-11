import { Controller, Get, Inject, Param, Render, Session } from "../../..";

@Controller("/")
export class HelloController {
  @Inject("test1")
  service: any;

  @Get("/say/:name")
  @Render("index")
  say(@Param("name") name: string, @Session() session: any) {
    session.count = session.count || 0;
    session.count++;
    name += session.count;
    return { name };
  }
}
