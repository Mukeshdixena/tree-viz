import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Habit } from './schemas/habit.schema';

@Injectable()
export class HabitService {
    constructor(@InjectModel(Habit.name) private habitModel: Model<Habit>) { }

    async findAll(userId: string): Promise<Habit[]> {
        return this.habitModel.find({ userId: new Types.ObjectId(userId) }).exec();
    }

    async create(userId: string, data: any): Promise<Habit> {
        const newHabit = new this.habitModel({
            ...data,
            userId: new Types.ObjectId(userId)
        });
        return newHabit.save();
    }

    async update(userId: string, id: string, data: any): Promise<Habit> {
        return this.habitModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        ).exec();
    }

    async delete(userId: string, id: string): Promise<any> {
        return this.habitModel.deleteOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId)
        }).exec();
    }

    async toggleLog(userId: string, habitId: string, date: string): Promise<Habit> {
        const habit = await this.habitModel.findOne({
            _id: new Types.ObjectId(habitId),
            userId: new Types.ObjectId(userId)
        });

        if (!habit) return null;

        const current = habit.logs.get(date);
        if (current && current.length > 0) {
            habit.logs.delete(date);
        } else {
            habit.logs.set(date, [{ value: 1, timestamp: new Date() }]);
        }

        habit.markModified('logs');
        return habit.save();
    }

    async logProgress(userId: string, habitId: string, date: string, value: number): Promise<Habit> {
        const habit = await this.habitModel.findOne({
            _id: new Types.ObjectId(habitId),
            userId: new Types.ObjectId(userId)
        });

        if (!habit) return null;

        const current = habit.logs.get(date) || [];
        current.push({ value, timestamp: new Date() });
        habit.logs.set(date, current);

        habit.markModified('logs');
        return habit.save();
    }

    async setProgress(userId: string, habitId: string, date: string, value: number): Promise<Habit> {
        const habit = await this.habitModel.findOne({
            _id: new Types.ObjectId(habitId),
            userId: new Types.ObjectId(userId)
        });

        if (!habit) return null;

        // For none/boolean it would just be a single entry
        habit.logs.set(date, [{ value, timestamp: new Date() }]);

        habit.markModified('logs');
        return habit.save();
    }
}
