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
        for (let i = 0; i < 24; i++) {
            const startH = i.toString().padStart(2, '0');
            const endH = ((i + 1) % 24).toString().padStart(2, '0');

            // Default "Top" and "Bottom" sleep blocks
            const isSleep = i < 7 || i >= 23;

            blocks.push({
                startTime: `${startH}:00`,
                endTime: `${endH}:00`,
                plan: isSleep ? 'Sleep' : '',
                tag: isSleep ? 'rest' : 'none',
                target: '',
                reality: '',
                completed: false
            });
        }
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

    async findMonthSummary(userId: string, year: number, month: number): Promise<any> {
        const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-31`; // Simplified

        const planners = await this.plannerModel.find({
            userId: new Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
        }, { date: 1, blocks: 1 }).exec();

        return planners.map(p => ({
            date: p.date,
            totalBlocks: p.blocks.length,
            completedBlocks: p.blocks.filter(b => b.completed).length,
            tags: Array.from(new Set(p.blocks.map(b => b.tag).filter(t => t && t !== 'none')))
        }));
    }
}
