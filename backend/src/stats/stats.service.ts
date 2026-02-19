import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Journal } from '../journal/schemas/journal.schema';
import { Task } from '../task/schemas/task.schema';
import { Tree } from '../tree/schemas/tree.schema';

@Injectable()
export class StatsService {
    constructor(
        @InjectModel(Journal.name) private journalModel: Model<Journal>,
        @InjectModel(Task.name) private taskModel: Model<Task>,
        @InjectModel(Tree.name) private treeModel: Model<Tree>,
    ) { }

    async getDashboardStats(userId: string) {
        const userObjId = new Types.ObjectId(userId);
        const tasks = await this.taskModel.find({ userId: userObjId }).exec();
        const trees = await this.treeModel.find({ userId: userObjId }).exec();
        const journals = await this.journalModel.find({ userId: userObjId }).exec();

        const completedGoals = tasks.filter(t => t.status === 'done').length;
        const activeGoals = tasks.filter(t => t.status !== 'done').length;

        // Calculate Topic Mastery
        const topicMastery = trees.map(tree => {
            const progress = this.calculateTreeProgress(tree);
            return {
                label: tree.name,
                percentage: progress
            };
        });

        // Calculate Streak (Simplified: based on journal entries)
        const streak = this.calculateStreak(journals);

        // Recent Activity (Mixed)
        const recentTasks = tasks
            .sort((a, b) => (b as any).updatedAt - (a as any).updatedAt)
            .slice(0, 2)
            .map(t => ({ type: 'task', title: `Task: ${t.title}`, date: (t as any).updatedAt }));

        const recentJournals = journals
            .sort((a, b) => (b as any).updatedAt - (a as any).updatedAt)
            .slice(0, 2)
            .map(j => ({ type: 'journal', title: `Journal: ${j.title}`, date: (j as any).updatedAt }));

        const recentActivity = [...recentTasks, ...recentJournals]
            .sort((a, b) => b.date - a.date)
            .slice(0, 5);

        // ── Count-Task Progress Stats ──
        // All tasks with a numeric target (targetType='count') — works for any user goal
        const countTasks = tasks.filter(t => t.targetType === 'count' && (t.targetTotal || 0) > 0);

        const countTotalDone = countTasks.reduce((sum, t) => sum + (t.targetCurrent || 0), 0);
        const countTotalGoal = countTasks.reduce((sum, t) => sum + (t.targetTotal || 0), 0);

        // Daily average: from earliest task creation date
        let countDailyAvg = 0;
        if (countTotalDone > 0 && countTasks.length > 0) {
            const earliest = countTasks.reduce((min, t) => {
                const created = (t as any).createdAt?.getTime() || Date.now();
                return created < min ? created : min;
            }, Date.now());
            const daysSinceStart = Math.max(1, Math.ceil((Date.now() - earliest) / (1000 * 86400)));
            countDailyAvg = Math.round((countTotalDone / daysSinceStart) * 10) / 10;
        }

        return {
            totalHours: 0,
            streak,
            completedGoals,
            activeGoals,
            topicMastery,
            recentActivity,
            // Count-type task progress stats (all tasks with numeric targets)
            countStats: {
                totalDone: countTotalDone,
                goal: countTotalGoal,
                dailyAvg: countDailyAvg,
                tasks: countTasks.map(t => ({
                    id: t._id,
                    title: t.title,
                    current: t.targetCurrent,
                    total: t.targetTotal,
                    status: t.status,
                    unit: (t as any).targetValue || 'units',
                })),
            }
        };
    }

    private calculateTreeProgress(tree: any): number {
        let total = 0;
        let completed = 0;

        const traverse = (node: any) => {
            if (!node.children || node.children.length === 0) {
                total++;
                if (node.status === 'done' || node.checked) completed++;
            } else {
                node.children.forEach(traverse);
            }
        };

        if (tree.children) {
            tree.children.forEach(traverse);
        }

        return total === 0 ? 0 : Math.round((completed / total) * 100);
    }

    private calculateStreak(journals: any[]): number {
        if (journals.length === 0) return 0;

        const dates = journals
            .map(j => j.date) // 'YYYY-MM-DD'
            .sort()
            .reverse();

        const uniqueDates = Array.from(new Set(dates));
        let streak = 0;
        let today = new Date();
        today.setHours(0, 0, 0, 0);

        let current = today;

        for (let i = 0; i < uniqueDates.length; i++) {
            const entryDate = new Date(uniqueDates[i]);
            entryDate.setHours(0, 0, 0, 0);

            const diffDays = Math.floor((current.getTime() - entryDate.getTime()) / (1000 * 3600 * 24));

            if (diffDays === 0) {
                streak++;
                current.setDate(current.getDate() - 1);
            } else if (diffDays === 1 && i === 0) {
                streak++;
                current = entryDate;
                current.setDate(current.getDate() - 1);
            } else {
                break;
            }
        }

        return streak;
    }
}
