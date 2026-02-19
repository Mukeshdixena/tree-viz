import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PlannerService } from './planner.service';
import { PlannerController } from './planner.controller';
import { Planner, PlannerSchema } from './schemas/planner.schema';
import { GatewayModule } from '../gateway/gateway.module';
import { Routine, RoutineSchema } from './schemas/routine.schema';
import { RoutineService } from './routine.service';
import { RoutineController } from './routine.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Planner.name, schema: PlannerSchema },
      { name: Routine.name, schema: RoutineSchema }
    ]),
    GatewayModule,
  ],
  controllers: [PlannerController, RoutineController],
  providers: [PlannerService, RoutineService],
})
export class PlannerModule { }
