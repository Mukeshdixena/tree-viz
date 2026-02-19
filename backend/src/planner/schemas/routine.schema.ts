import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema()
class RoutineBlock {
    @Prop({ required: true })
    startTime: string;

    @Prop({ required: true })
    endTime: string;

    @Prop({ default: '' })
    plan: string;
}

@Schema({ timestamps: true })
export class Routine extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    name: string;

    @Prop({ default: 'Sun' })
    icon: string; // Icon name from lucide-react

    @Prop({ type: [RoutineBlock], default: [] })
    blocks: RoutineBlock[];
}

export const RoutineSchema = SchemaFactory.createForClass(Routine);
RoutineSchema.index({ userId: 1, name: 1 }, { unique: true });
