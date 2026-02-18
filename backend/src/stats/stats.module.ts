import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StatsService } from './stats.service';
import { StatsController } from './stats.controller';
import { Journal, JournalSchema } from '../journal/schemas/journal.schema';
import { Task, TaskSchema } from '../task/schemas/task.schema';
import { Tree, TreeSchema } from '../tree/schemas/tree.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Journal.name, schema: JournalSchema },
      { name: Task.name, schema: TaskSchema },
      { name: Tree.name, schema: TreeSchema },
    ]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule { }
