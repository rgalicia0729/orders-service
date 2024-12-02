// NestJS imports
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Module } from '@nestjs/common';

// Local imports
import { envs } from '../config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: envs.injectionToken,
        transport: Transport.NATS,
        options: {
          servers: envs.natsServers,
        },
      },
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
