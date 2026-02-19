import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GoalController } from './goal.controller';
import { GoalService } from './goal.service';
import { Goal, GoalSchema } from './schemas/goal.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Goal.name, schema: GoalSchema }])],
    controllers: [GoalController],
    providers: [GoalService],
    exports: [GoalService],
})
export class GoalModule { }
