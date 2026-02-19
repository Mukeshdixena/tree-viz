import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedController } from './seed.controller';
import { SeedService } from './seed.service';
import { User, UserSchema } from '../auth/schemas/user.schema';
import { Habit, HabitSchema } from '../habit/schemas/habit.schema';
import { Planner, PlannerSchema } from '../planner/schemas/planner.schema';
import { Task, TaskSchema } from '../task/schemas/task.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: Habit.name, schema: HabitSchema },
            { name: Planner.name, schema: PlannerSchema },
            { name: Task.name, schema: TaskSchema },
        ])
    ],
    controllers: [SeedController],
    providers: [SeedService],
})
export class SeedModule { }
