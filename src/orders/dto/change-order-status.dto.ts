import { OrderStatus } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class ChangeOrderStatusDto {
  @IsUUID()
  public id: string;

  @IsEnum(OrderStatus)
  public status: OrderStatus;
}
