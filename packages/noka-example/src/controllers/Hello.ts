import { Controller, Get, Inject, Param, Render } from "noka";
import { TestService } from "../services/Hello";

@Controller("/")
export class HelloController {
  @Inject("test")
  service: TestService;

  @Get("/")
  // @Render("index")
  async index() {
    const list = await this.service.create();
    return { name: "Index", list };
  }

  @Get("/hello/:name")
  @Get("/hello")
  @Render("index")
  async say(@Param("name") name = "World") {
    return { name };
  }
}
