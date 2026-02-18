import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Planner } from './schemas/planner.schema';

@Injectable()
export class PlannerService {
    constructor(@InjectModel(Planner.name) private plannerModel: Model<Planner>) { }

    async findByDate(userId: string, date: string): Promise<any> {
        let planner = await this.plannerModel.findOne({
            userId: new Types.ObjectId(userId),
            date
        }).exec();

        if (!planner) {
            // Initialize with default blocks if it doesn't exist
            planner = await this.createDefault(userId, date);
        }
        return planner;
    }

    async createDefault(userId: string, date: string): Promise<any> {
        const blocks = [];
        for (let i = 6; i < 24; i++) {
            const hour = i < 10 ? `0${i}:00` : `${i}:00`;
            const nextHour = (i + 1) < 10 ? `0${i + 1}:00` : `${(i + 1)}:00`;
            blocks.push({
                startTime: hour,
                endTime: nextHour,
                plan: '',
                reality: '',
                completed: false
            });
        }
        const newPlanner = new this.plannerModel({ userId: new Types.ObjectId(userId), date, blocks });
        return newPlanner.save();
    }

    async update(userId: string, date: string, data: any): Promise<any> {
        return this.plannerModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId), date },
            { $set: data },
            { new: true }
        ).exec();
    }
}
