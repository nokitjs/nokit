import { Controller, Get, Inject, Render } from "noka";
import { ItemService } from "../services/Hello";

@Controller("/")
export class HelloController {
  @Inject("itemService")
  itemService: ItemService;

  @Get("/")
  @Render("index")
  async index() {
    await this.itemService.create();
    const items = await this.itemService.list();
    return { items };
  }
}
