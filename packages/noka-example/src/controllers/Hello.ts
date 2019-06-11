import { Controller, Get, Inject, Param, Render } from "noka";

@Controller("/")
export class HelloController {
  @Inject("test1")
  service: any;

  @Get("/")
  @Render("index")
  index() {
    return { name: "Index" };
  }

  @Get("/hello/:name")
  @Get("/hello")
  @Render("index")
  say(@Param("name") name = "World") {
    return { name };
  }
}
