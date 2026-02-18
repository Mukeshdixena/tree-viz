import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Journal extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    date: string;

    @Prop({ required: true })
    title: string;

    @Prop({ required: true })
    content: string;
}

export const JournalSchema = SchemaFactory.createForClass(Journal);
