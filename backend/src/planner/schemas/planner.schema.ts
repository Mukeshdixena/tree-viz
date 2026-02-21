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

    @Prop({ default: '' })
    target: string; // e.g. "300 questions" or "30h"

    @Prop({ default: '' })
    tag: string;

    @Prop({ default: 0 })
    completed: number; // 0 to 100

    @Prop({ type: Types.ObjectId, ref: 'Task', default: null })
    taskId: Types.ObjectId;

    @Prop({ default: 0 })
    progressMade: number;
}

const TimeBlockSchema = SchemaFactory.createForClass(TimeBlock);

@Schema()
class DayTask {
    @Prop({ type: Types.ObjectId, ref: 'Task', required: true })
    taskId: Types.ObjectId;

    @Prop({ default: 0 })
    progressMade: number;
}

const DayTaskSchema = SchemaFactory.createForClass(DayTask);

@Schema({ timestamps: true })
export class Planner extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    date: string; // YYYY-MM-DD

    @Prop({ type: [TimeBlockSchema], default: [] })
    blocks: TimeBlock[];

    @Prop({ type: [DayTaskSchema], default: [] })
    dayTasks: any[];

    @Prop({ default: '' })
    summary: string;

    @Prop({ default: '' })
    wakeUpTime: string; // e.g. "06:30"
}

export const PlannerSchema = SchemaFactory.createForClass(Planner);
// Index for quick lookup by date and user
PlannerSchema.index({ userId: 1, date: 1 }, { unique: true });
