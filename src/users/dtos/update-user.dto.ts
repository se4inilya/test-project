import { IsNumber } from 'class-validator';

export class UpdateUserDto {
  @IsNumber()
  bossId: number;
}
