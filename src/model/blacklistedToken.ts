import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('blacklisted_tokens')
export class BlacklistedToken {
  @PrimaryColumn()
  token: string;

  @Column({ name: 'expires_at' })
  expiresAt: Date;
}
