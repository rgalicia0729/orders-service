// NestJS imports
import { HttpStatus, Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';

// Third party imports
import { Order, PrismaClient } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

// Local imports
import { ChangeOrderStatusDto, CreateOrderDto, GetOrdersDto } from './dto';
import { envs } from '../config';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {
  constructor(
    @Inject(envs.injectionToken)
    private readonly client: ClientProxy,
  ) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
  }

  async create(payload: CreateOrderDto) {
    try {
      const productIds = payload.items.map((item) => item.productId);

      const products = await this.getProductsByIds(productIds);

      const totalAmount = payload.items.reduce((_, item) => {
        const price = products.find(
          (product) => product.id === item.productId,
        ).price;

        return price * item.quantity;
      }, 0);

      const totalItems = payload.items.reduce((acc, item) => {
        return acc + item.quantity;
      }, 0);

      const order = await this.order.create({
        data: {
          totalAmount,
          totalItems,
          OrderItem: {
            createMany: {
              data: payload.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: products.find((product) => product.id === item.productId)
                  .price,
              })),
            },
          },
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });

      return {
        ...order,
        OrderItem: order.OrderItem.map((orderItem) => ({
          ...orderItem,
          productName: products.find(
            (product) => product.id === orderItem.productId,
          ).name,
        })),
      };
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }

  async findAll(payload: GetOrdersDto): Promise<any> {
    const { page, limit, status } = payload;

    const totalRecords = await this.order.count({
      where: {
        status: status,
      },
    });

    const lastPage = Math.ceil(totalRecords / limit);

    const orders = await this.order.findMany({
      where: { status: status },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: orders,
      totalRecords,
      page,
      lastPage,
    };
  }

  async findOne(id: string) {
    const order = await this.order.findFirst({
      where: { id },
      include: {
        OrderItem: { select: { price: true, quantity: true, productId: true } },
      },
    });

    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`,
      });
    }

    const productIds = order.OrderItem.map((item) => item.productId);
    const products = await this.getProductsByIds(productIds);

    return {
      ...order,
      OrderItem: order.OrderItem.map((orderItem) => ({
        ...orderItem,
        productName: products.find(
          (product) => product.id === orderItem.productId,
        ).name,
      })),
    };
  }

  async changeOrderStatus(payload: ChangeOrderStatusDto): Promise<Order> {
    const { id, status } = payload;

    const order = await this.findOne(id);

    if (order.status === status) return order;

    return this.order.update({
      where: { id },
      data: { status },
    });
  }

  private async getProductsByIds(productIds: number[]) {
    try {
      const products = await firstValueFrom(
        this.client.send({ cmd: 'VALIDATE_PRODUCTS' }, productIds),
      );

      return products;
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: error.message,
      });
    }
  }
}
