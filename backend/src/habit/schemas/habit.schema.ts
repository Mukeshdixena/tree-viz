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

    // Stores numeric values per day: date string "YYYY-MM-DD" -> amount (hours/count/sessions)
    @Prop({ type: Map, of: Number, default: {} })
    logs: Map<string, number>;

    @Prop({ default: 'session' })
    unit: string; // e.g. "hours", "questions", "sessions", "km"

    @Prop({ default: 1 })
    dailyTarget: number; // target amount per day
}

export const HabitSchema = SchemaFactory.createForClass(Habit);
HabitSchema.index({ userId: 1, name: 1 }, { unique: true });
