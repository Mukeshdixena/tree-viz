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

    @Prop({ type: String, default: 'todo' })
    status: string; // 'todo', 'in-progress', 'done'

    @Prop({ type: String, default: 'medium' })
    priority: string; // 'low', 'medium', 'high'

    @Prop({ type: String, default: '' })
    notes: string;

    @Prop({ type: Array, default: [] })
    links: { title: string, url: string }[];

    @Prop({ type: String, default: '' })
    dueDate: string;
}

export const TreeSchema = SchemaFactory.createForClass(Tree);
