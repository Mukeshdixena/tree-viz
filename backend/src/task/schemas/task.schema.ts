import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Task extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ default: 'todo' })
    status: string; // 'todo', 'in-progress', 'done'

    @Prop({ default: 'medium' })
    priority: string; // 'low', 'medium', 'high'

    @Prop()
    dueDate: string;

    @Prop({ default: 'none' })
    targetType: string; // 'none', 'time', 'count'

    @Prop({ default: '' })
    targetValue: string;

    @Prop({ default: 0 })
    targetTotal: number;

    @Prop({ default: 0 })
    targetCurrent: number;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
