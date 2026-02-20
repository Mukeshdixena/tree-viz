import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
export class HabitLogEntry {
    @Prop({ default: 1 })
    value: number;

    @Prop({ default: Date.now })
    timestamp: Date;
}

export const HabitLogEntrySchema = SchemaFactory.createForClass(HabitLogEntry);

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

    @Prop({ enum: ['none', 'count', 'hours'], default: 'none' })
    trackingType: string;

    @Prop({ type: Map, of: [HabitLogEntrySchema], default: {} })
    logs: Map<string, HabitLogEntry[]>; // date string "YYYY-MM-DD" -> array of logs
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
HabitSchema.index({ userId: 1, name: 1 }, { unique: true });
