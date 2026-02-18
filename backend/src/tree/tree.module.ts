import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreeController } from './tree.controller';
import { TreeService } from './tree.service';
import { Tree, TreeSchema } from './schemas/tree.schema';
import { GatewayModule } from '../gateway/gateway.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Tree.name, schema: TreeSchema }]),
        GatewayModule,
    ],
    controllers: [TreeController],
    providers: [TreeService],
})
export class TreeModule { }
