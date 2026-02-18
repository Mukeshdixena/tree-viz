import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
class TimeBlock {
    @Prop({ required: true })
    startTime: string; // e.g. "09:00"

    @Prop({ required: true })
    endTime: string; // e.g. "10:00"

    @Prop({ default: '' })
    plan: string;

    @Prop({ default: '' })
    reality: string;

    @Prop({ default: false })
    completed: boolean;
}

@Schema({ timestamps: true })
export class Planner extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    date: string; // YYYY-MM-DD

    @Prop({ type: [TimeBlock], default: [] })
    blocks: TimeBlock[];

    @Prop({ default: '' })
    summary: string;
}

export const PlannerSchema = SchemaFactory.createForClass(Planner);
// Index for quick lookup by date and user
PlannerSchema.index({ userId: 1, date: 1 }, { unique: true });
