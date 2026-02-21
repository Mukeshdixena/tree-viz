import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Planner } from './schemas/planner.schema';
import { Task } from '../task/schemas/task.schema';

@Injectable()
export class PlannerService {
    constructor(
        @InjectModel(Planner.name) private plannerModel: Model<Planner>,
        @InjectModel(Task.name) private taskModel: Model<Task>
    ) { }

    async findByDate(userId: string, date: string): Promise<any> {
        const planner = await this.plannerModel.findOne({
            userId: new Types.ObjectId(userId),
            date
        }).exec();

        if (!planner) {
            return {
                userId,
                date,
                blocks: [],
                summary: '',
                wakeUpTime: ''
            };
        }
        return planner;
    }


    async update(userId: string, date: string, data: any): Promise<any> {
        const { blocks, summary, wakeUpTime, dayTasks } = data;

        // Find existing planner to track tasks that might be removed
        const oldPlanner = await this.plannerModel.findOne({
            userId: new Types.ObjectId(userId),
            date
        }).exec();

        const taskIdsToUpdate = new Set<string>();
        if (oldPlanner) {
            oldPlanner.blocks.forEach(b => {
                if (b.taskId) taskIdsToUpdate.add(b.taskId.toString());
            });
            if (oldPlanner.dayTasks) {
                oldPlanner.dayTasks.forEach(t => {
                    if (t.taskId) taskIdsToUpdate.add(t.taskId.toString());
                });
            }
        }

        const updatedPlanner = await this.plannerModel.findOneAndUpdate(
            { userId: new Types.ObjectId(userId), date },
            { $set: { blocks: blocks || [], summary: summary || '', wakeUpTime: wakeUpTime || '', dayTasks: dayTasks || [] } },
            { new: true, upsert: true }
        ).exec();

        // Add new task IDs to the update set
        if (blocks) {
            blocks.forEach(block => {
                if (block.taskId) taskIdsToUpdate.add(block.taskId.toString());
            });
        }
        if (dayTasks) {
            dayTasks.forEach(t => {
                if (t.taskId) taskIdsToUpdate.add(t.taskId.toString());
            });
        }

        for (const taskId of taskIdsToUpdate) {
            if (taskId && taskId !== 'null' && taskId !== 'undefined') {
                await this.calculateTaskProgress(userId, taskId);
            }
        }

        return updatedPlanner;
    }

    private async calculateTaskProgress(userId: string, taskId: string) {
        // Find all planner entries that reference this task
        // We check for both string and ObjectId versions to be safe with existing data
        const planners = await this.plannerModel.find({
            userId: new Types.ObjectId(userId),
            $or: [
                { 'blocks.taskId': taskId },
                { 'blocks.taskId': new Types.ObjectId(taskId) },
                { 'dayTasks.taskId': taskId },
                { 'dayTasks.taskId': new Types.ObjectId(taskId) }
            ]
        }).exec();

        let totalProgress = 0;
        planners.forEach(p => {
            p.blocks.forEach(b => {
                if (b.taskId && b.taskId.toString() === taskId.toString()) {
                    totalProgress += b.progressMade || 0;
                }
            });
            if (p.dayTasks) {
                p.dayTasks.forEach(t => {
                    if (t.taskId && t.taskId.toString() === taskId.toString()) {
                        totalProgress += t.progressMade || 0;
                    }
                });
            }
        });

        const task = await this.taskModel.findById(taskId);
        if (task) {
            task.targetCurrent = totalProgress;

            if (task.targetTotal > 0) {
                if (totalProgress >= task.targetTotal) {
                    task.status = 'done';
                } else if (totalProgress > 0) {
                    task.status = 'in-progress';
                } else if (task.status === 'in-progress' || task.status === 'done') {
                    task.status = 'todo';
                }
            }
            await task.save();
        }
    }

    async findMonthSummary(userId: string, year: number, month: number): Promise<any> {
        const startDate = `${year}-${(month + 1).toString().padStart(2, '0')}-01`;
        const endDate = `${year}-${(month + 1).toString().padStart(2, '0')}-31`; // Simplified

        const planners = await this.plannerModel.find({
            userId: new Types.ObjectId(userId),
            date: { $gte: startDate, $lte: endDate }
        }, { date: 1, blocks: 1, wakeUpTime: 1 }).exec();

        return planners.map(p => ({
            date: p.date,
            totalBlocks: p.blocks.length,
            completedBlocks: p.blocks.reduce((acc, b) => acc + (Number(b.completed) || 0) / 100, 0),
            tags: Array.from(new Set(p.blocks.map(b => b.tag).filter(t => t && t !== 'none'))),
            wakeUpTime: p.wakeUpTime || ''
        }));
    }
}
