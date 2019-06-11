import { Entity, Column, PrimaryGeneratedColumn } from "noka";

@Entity()
export class Demo {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  name: string;
}
