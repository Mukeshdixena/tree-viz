import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Habit extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ default: 'Zap' })
    icon: string;

    @Prop({ default: '#14b8a6' })
    color: string;

    @Prop({ type: Map, of: Boolean, default: {} })
    logs: Map<string, boolean>; // date string "YYYY-MM-DD" -> completed
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
HabitSchema.index({ userId: 1, name: 1 }, { unique: true });
