import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('migrations')
export class MigrationDocument {
  @PrimaryColumn()
  name: string;

  @Column({ name: 'executed_at' })
  executedAt: Date;
}
