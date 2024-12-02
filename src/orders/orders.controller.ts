// NestJS imports
import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

// Local imports
import { ChangeOrderStatusDto, CreateOrderDto, GetOrdersDto } from './dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @MessagePattern({ cmd: 'CREATE_ORDER' })
  create(@Payload() payload: CreateOrderDto) {
    return this.ordersService.create(payload);
  }

  @MessagePattern({ cmd: 'FIND_ORDERS' })
  findAll(@Payload() payload: GetOrdersDto) {
    return this.ordersService.findAll(payload);
  }

  @MessagePattern({ cmd: 'FIND_ORDER' })
  findOne(@Payload('id', ParseUUIDPipe) id: string) {
    return this.ordersService.findOne(id);
  }

  @MessagePattern({ cmd: 'CHANGE_ORDER_STATUS' })
  changeOrderStatus(@Payload() payload: ChangeOrderStatusDto) {
    return this.ordersService.changeOrderStatus(payload);
  }
}
