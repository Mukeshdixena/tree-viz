import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HabitController } from './habit.controller';
import { HabitService } from './habit.service';
import { Habit, HabitSchema } from './schemas/habit.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Habit.name, schema: HabitSchema }])
    ],
    controllers: [HabitController],
    providers: [HabitService],
    exports: [HabitService]
})
export class HabitModule { }
