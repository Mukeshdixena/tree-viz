import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TreeController } from './tree.controller';
import { TreeService } from './tree.service';
import { Tree, TreeSchema } from './schemas/tree.schema';

@Module({
    imports: [MongooseModule.forFeature([{ name: Tree.name, schema: TreeSchema }])],
    controllers: [TreeController],
    providers: [TreeService],
})
export class TreeModule { }
