import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Note extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    userId: Types.ObjectId;

    @Prop({ required: false, default: '' })
    text: string;

    @Prop({ default: '#fef3c7' })
    color: string;
}

export const NoteSchema = SchemaFactory.createForClass(Note);
