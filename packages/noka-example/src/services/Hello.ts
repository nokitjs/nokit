import { Conn, Connection, Provider } from "noka";
import { Item } from "../models/Item";

@Provider("itemService")
export class ItemService {
  @Conn()
  conn: Connection;

  async create() {
    const repo = this.conn.getRepository(Item);
    const demo = new Item();
    demo.name = "test";
    return repo.save(demo);
  }

  async list() {
    const repo = this.conn.getRepository(Item);
    return repo.find({ skip: 0, take: 10 });
  }
}
