import { Entity, Column, PrimaryGeneratedColumn } from "noka";

@Entity()
export class Item {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;
}
