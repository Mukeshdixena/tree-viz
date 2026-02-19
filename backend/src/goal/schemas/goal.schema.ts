import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
class Milestone {
    @Prop({ required: true })
    label: string;

    @Prop({ required: true })
    targetValue: number;

    @Prop({ default: false })
    achieved: boolean;
}

const MilestoneSchema = SchemaFactory.createForClass(Milestone);

@Schema({ timestamps: true })
export class Goal extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop({ default: '' })
    description: string;

    @Prop({ default: '#3b82f6' })
    color: string;

    @Prop({ default: 'units' })
    unit: string; // e.g. "questions", "books", "km", "hours"

    @Prop({ required: true, default: 100 })
    targetValue: number;

    @Prop({ default: 0 })
    currentValue: number;

    @Prop({ default: '' })
    dueDate: string; // YYYY-MM-DD

    // Date-keyed progress log: "YYYY-MM-DD" -> amount added that day
    @Prop({ type: Map, of: Number, default: {} })
    logs: Map<string, number>;

    @Prop({ type: [MilestoneSchema], default: [] })
    milestones: Milestone[];
}

export const GoalSchema = SchemaFactory.createForClass(Goal);
GoalSchema.index({ userId: 1 });
