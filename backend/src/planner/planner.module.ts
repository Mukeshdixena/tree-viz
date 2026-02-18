import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { Planner, PlannerSchema } from './schemas/planner.schema';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Planner.name, schema: PlannerSchema }]),
    GatewayModule,
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
})
export class PlannerModule { }
