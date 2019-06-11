import { Provider, Connection, Conn } from "noka";
import { Demo } from "../models/Example";

@Provider("test")
export class TestService {
  @Conn()
  conn: Connection;

  async create() {
    const repo = this.conn.getRepository(Demo);
    const demo = new Demo();
    demo.name = "test";
    await repo.save(demo);
    return repo.find({});
  }
}
