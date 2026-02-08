import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Tree extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ type: Array, default: [] })
    children: any[];

    @Prop({ type: Boolean, default: false })
    checked: boolean;

    @Prop({ type: Boolean, default: false })
    toggled: boolean;
}

export const TreeSchema = SchemaFactory.createForClass(Tree);
