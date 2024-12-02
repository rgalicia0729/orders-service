// Third party imports
import { OrderStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

// Local imports
import { PaginationDto } from '../../common';

export class GetOrdersDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatus)
  public status?: OrderStatus;
}
