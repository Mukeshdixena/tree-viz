import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Task } from './schemas/task.schema';

@Injectable()
export class TaskService {
    constructor(@InjectModel(Task.name) private taskModel: Model<Task>) { }

    async findAll(userId: string): Promise<Task[]> {
        return this.taskModel.find({ userId: new Types.ObjectId(userId) }).exec();
    }

    async create(userId: string, data: any): Promise<Task> {
        const newTask = new this.taskModel({ ...data, userId: new Types.ObjectId(userId) });
        return newTask.save();
    }

    async update(id: string, userId: string, data: any): Promise<Task> {
        return this.taskModel.findOneAndUpdate({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }, data, { new: true }).exec();
    }

    async remove(id: string, userId: string): Promise<any> {
        return this.taskModel.deleteOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }).exec();
    }
}
