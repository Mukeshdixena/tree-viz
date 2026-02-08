import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreeModule } from './tree/tree.module';
import { AuthModule } from './auth/auth.module';

@Module({
    imports: [
        MongooseModule.forRoot('mongodb+srv://root:chintu@cluster0.alpyjmp.mongodb.net/tree-viz?appName=Cluster0'),
        AuthModule,
        TreeModule,
    ],
})
export class AppModule { }
