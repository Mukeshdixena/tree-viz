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

    /**
     * Log a numeric value for a habit on a specific date.
     * value=0 removes the entry for that day.
     * Migrates old boolean logs (true) to 1 on the fly.
     */
    async logValue(userId: string, habitId: string, date: string, value: number): Promise<Habit> {
        const habit = await this.habitModel.findOne({
            _id: new Types.ObjectId(habitId),
            userId: new Types.ObjectId(userId)
        });

        if (!habit) return null;

        if (value <= 0) {
            habit.logs.delete(date);
        } else {
            habit.logs.set(date, value);
        }

        return habit.save();
    }

    /**
     * Legacy toggle support: if no value provided, toggle between 0 and 1
     */
    async toggleLog(userId: string, habitId: string, date: string): Promise<Habit> {
        const habit = await this.habitModel.findOne({
            _id: new Types.ObjectId(habitId),
            userId: new Types.ObjectId(userId)
        });

        if (!habit) return null;

        const current = habit.logs.get(date);
        // Handle migration from boolean true -> 1
        const currentNum = typeof current === 'boolean' ? (current ? 1 : 0) : (current || 0);

        if (currentNum > 0) {
            habit.logs.delete(date);
        } else {
            habit.logs.set(date, 1);
        }

        return habit.save();
    }

    /**
     * Get cumulative stats for a habit.
     */
    async getStats(userId: string, habitId: string): Promise<any> {
        const habit = await this.habitModel.findOne({
            _id: new Types.ObjectId(habitId),
            userId: new Types.ObjectId(userId)
        });

        if (!habit) return null;

        let total = 0;
        habit.logs.forEach((val) => {
            const v = typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0);
            total += v;
        });

        const today = new Date().toISOString().split('T')[0];
        const todayValue = Number(habit.logs.get(today) || 0);

        // Calculate streak
        let streak = 0;
        const now = new Date();
        for (let i = 0; i < 365; i++) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            const dStr = d.toISOString().split('T')[0];
            const val = habit.logs.get(dStr);
            const numVal = typeof val === 'boolean' ? (val ? 1 : 0) : (val || 0);
            if (numVal > 0) streak++;
            else break;
        }

        return { total, todayValue, streak };
    }
}
