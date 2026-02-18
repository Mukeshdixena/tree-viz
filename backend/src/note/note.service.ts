import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Note } from './schemas/note.schema';

@Injectable()
export class NoteService {
    constructor(@InjectModel(Note.name) private noteModel: Model<Note>) { }

    async findAll(userId: string): Promise<Note[]> {
        return this.noteModel.find({ userId: new Types.ObjectId(userId) }).sort({ updatedAt: -1 }).exec();
    }

    async create(userId: string, data: any): Promise<Note> {
        const newNote = new this.noteModel({ ...data, userId: new Types.ObjectId(userId) });
        return newNote.save();
    }

    async update(id: string, userId: string, data: any): Promise<Note> {
        return this.noteModel.findOneAndUpdate({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }, data, { new: true }).exec();
    }

    async remove(id: string, userId: string): Promise<any> {
        return this.noteModel.deleteOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }).exec();
    }
}
