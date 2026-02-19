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
        const newPlanner = new this.plannerModel({ userId: new Types.ObjectId(userId), date, blocks });
        return newPlanner.save();
    }

    async update(userId: string, date: string, data: any): Promise<any> {
        const { blocks, summary } = data;
        return this.plannerModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId), date },
            { $set: { blocks, summary } },
            { new: true }
        ).exec();
    }
}
