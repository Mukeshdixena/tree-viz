import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Goal } from './schemas/goal.schema';

@Injectable()
export class GoalService {
    constructor(@InjectModel(Goal.name) private goalModel: Model<Goal>) { }

    async findAll(userId: string): Promise<Goal[]> {
        return this.goalModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).exec();
    }

    async create(userId: string, data: any): Promise<Goal> {
        const goal = new this.goalModel({
            ...data,
            userId: new Types.ObjectId(userId),
            currentValue: 0,
            logs: {}
        });
        return goal.save();
    }

    async update(userId: string, id: string, data: any): Promise<Goal> {
        return this.goalModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        ).exec();
    }

    async delete(userId: string, id: string): Promise<any> {
        return this.goalModel.deleteOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId)
        }).exec();
    }

    /**
     * Log progress toward the goal.
     * Adds `amount` to currentValue and appends to today's log entry.
     * Supports subtract (negative amount) but clamps currentValue at 0.
     */
    async logProgress(userId: string, goalId: string, amount: number): Promise<Goal> {
        const goal = await this.goalModel.findOne({
            _id: new Types.ObjectId(goalId),
            userId: new Types.ObjectId(userId)
        });

        if (!goal) throw new NotFoundException('Goal not found');

        const today = new Date().toISOString().split('T')[0];
        const existingToday = Number(goal.logs.get(today) || 0);
        const newToday = existingToday + amount;

        goal.logs.set(today, Math.max(0, newToday));
        goal.currentValue = Math.max(0, goal.currentValue + amount);

        // Mark milestones as achieved if crossed
        if (goal.milestones && goal.milestones.length > 0) {
            goal.milestones.forEach(m => {
                if (!m.achieved && goal.currentValue >= m.targetValue) {
                    m.achieved = true;
                }
            });
        }

        return goal.save();
    }

    /**
     * Set absolute currentValue (for manual corrections).
     */
    async setProgress(userId: string, goalId: string, value: number): Promise<Goal> {
        const goal = await this.goalModel.findOne({
            _id: new Types.ObjectId(goalId),
            userId: new Types.ObjectId(userId)
        });
        if (!goal) throw new NotFoundException('Goal not found');

        goal.currentValue = Math.max(0, value);

        if (goal.milestones && goal.milestones.length > 0) {
            goal.milestones.forEach(m => {
                m.achieved = goal.currentValue >= m.targetValue;
            });
        }

        return goal.save();
    }
}
