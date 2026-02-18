import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreeModule } from './tree/tree.module';
import { AuthModule } from './auth/auth.module';
import { JournalModule } from './journal/journal.module';
import { TaskModule } from './task/task.module';
import { NoteModule } from './note/note.module';
import { StatsModule } from './stats/stats.module';
import { GatewayModule } from './gateway/gateway.module';
import { PlannerModule } from './planner/planner.module';

@Module({
    imports: [
        MongooseModule.forRoot('mongodb+srv://root:chintu@cluster0.alpyjmp.mongodb.net/tree-viz?appName=Cluster0'),
        AuthModule,
        TreeModule,
        JournalModule,
        TaskModule,
        NoteModule,
        StatsModule,
        GatewayModule,
        PlannerModule,
    ],
})
export class AppModule { }
