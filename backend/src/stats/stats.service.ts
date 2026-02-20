import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Journal } from '../journal/schemas/journal.schema';
import { Task } from '../task/schemas/task.schema';
import { Tree } from '../tree/schemas/tree.schema';
import { Habit } from '../habit/schemas/habit.schema';
import { Planner } from '../planner/schemas/planner.schema';

@Injectable()
export class StatsService {
    constructor(
        @InjectModel(Journal.name) private journalModel: Model<Journal>,
        @InjectModel(Task.name) private taskModel: Model<Task>,
        @InjectModel(Tree.name) private treeModel: Model<Tree>,
        @InjectModel(Habit.name) private habitModel: Model<Habit>,
        @InjectModel(Planner.name) private plannerModel: Model<Planner>,
    ) { }

    async getDashboardStats(userId: string) {
        const userObjId = new Types.ObjectId(userId);
        const tasks = await this.taskModel.find({ userId: userObjId }).exec();
        const trees = await this.treeModel.find({ userId: userObjId }).exec();
        const journals = await this.journalModel.find({ userId: userObjId }).exec();
        const habits = await this.habitModel.find({ userId: userObjId }).exec();
        const planners = await this.plannerModel.find({ userId: userObjId }).exec();

        const completedGoals = tasks.filter(t => t.status === 'done').length;
        const activeGoals = tasks.filter(t => t.status !== 'done').length;

        // Calculate hours from tasks and habits (where trackingType is hours)
        let totalHours = 0;
        // From tasks (placeholder logic or add field if exists)
        // From habits
        habits.filter(h => h.trackingType === 'hours').forEach(h => {
            h.logs.forEach((entries: any[]) => {
                entries.forEach(e => totalHours += (e.value || 0));
            });
        });

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
            .slice(0, 3)
            .map(t => ({ type: 'task', title: `Task: ${t.title}`, date: (t as any).updatedAt }));

        const recentJournals = journals
            .sort((a, b) => (b as any).updatedAt - (a as any).updatedAt)
            .slice(0, 3)
            .map(j => ({ type: 'journal', title: `Journal: ${j.title}`, date: (j as any).updatedAt }));

        const recentActivity = [...recentTasks, ...recentJournals]
            .sort((a, b) => b.date.getTime() - a.date.getTime())
            .slice(0, 10);

        // Calculate All-time Habit Totals
        const habitStats = habits.map(habit => {
            let total = 0;
            if (habit.logs) {
                habit.logs.forEach((entries: any[]) => {
                    entries.forEach(e => total += (e.value || 0));
                });
            }
            return {
                _id: habit._id,
                name: habit.name,
                trackingType: habit.trackingType,
                total: Math.round(total * 10) / 10,
                color: habit.color,
                icon: habit.icon
            };
        });

        // Calculate Average Wakeup Time
        const wakeUpTimes = planners
            .map(p => p.wakeUpTime)
            .filter(t => t && t.includes(':'));

        let avgWakeUp = '--:--';
        if (wakeUpTimes.length > 0) {
            let totalMinutes = 0;
            wakeUpTimes.forEach(t => {
                const [h, m] = t.split(':').map(Number);
                totalMinutes += h * 60 + m;
            });
            const avgMinutes = Math.round(totalMinutes / wakeUpTimes.length);
            const avgH = Math.floor(avgMinutes / 60);
            const avgM = avgMinutes % 60;
            avgWakeUp = `${avgH.toString().padStart(2, '0')}:${avgM.toString().padStart(2, '0')}`;
        }

        const today = new Date().toISOString().split('T')[0];
        const todayPlanner = planners.find(p => p.date === today);
        const todayWakeUp = todayPlanner?.wakeUpTime || '--:--';

        return {
            totalHours: Math.round(totalHours * 10) / 10,
            streak,
            completedGoals,
            activeGoals,
            topicMastery,
            recentActivity,
            habitStats,
            avgWakeUp,
            todayWakeUp
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
                // If no entry today but entry yesterday, start counting from yesterday
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
