import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Journal } from './schemas/journal.schema';

@Injectable()
export class JournalService {
    constructor(@InjectModel(Journal.name) private journalModel: Model<Journal>) { }

    async findAll(userId: string): Promise<Journal[]> {
        return this.journalModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }

    async create(userId: string, data: any): Promise<Journal> {
        const newEntry = new this.journalModel({ ...data, userId: new Types.ObjectId(userId) });
        return newEntry.save();
    }

    async update(id: string, userId: string, data: any): Promise<Journal> {
        return this.journalModel.findOneAndUpdate({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }, data, { new: true }).exec();
    }

    async remove(id: string, userId: string): Promise<any> {
        return this.journalModel.deleteOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }).exec();
    }
}
