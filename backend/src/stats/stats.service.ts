import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Journal } from '../journal/schemas/journal.schema';
import { Task } from '../task/schemas/task.schema';
import { Tree } from '../tree/schemas/tree.schema';
import { Habit } from '../habit/schemas/habit.schema';
import { Planner } from '../planner/schemas/planner.schema';

// Helper to get last N date strings (YYYY-MM-DD) ending today
function getLastNDates(n: number): string[] {
    const dates: string[] = [];
    for (let i = 0; i < n; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
    }
    return dates;
}

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

    async getDisciplineScore(userId: string) {
        const userObjId = new Types.ObjectId(userId);
        const last7 = getLastNDates(7);
        const last3 = getLastNDates(3);

        const habits = await this.habitModel.find({ userId: userObjId }).exec();
        const planners = await this.plannerModel.find({ userId: userObjId, date: { $in: last7 } }).exec();
        const tasks = await this.taskModel.find({ userId: userObjId }).exec();
        const journals = await this.journalModel.find({ userId: userObjId }).exec();

        // ── 1. Habit Consistency (40%) ────────────────────────────────────
        // For each of the last 7 days, what fraction of habits were done?
        let habitDayScores: number[] = [];
        if (habits.length > 0) {
            for (const dateStr of last7) {
                const doneCnt = habits.filter(h => {
                    const logs = h.logs instanceof Map ? (h.logs as Map<string, any[]>).get(dateStr) : (h.logs as any)?.[dateStr];
                    return logs && Array.isArray(logs) && logs.length > 0;
                }).length;
                habitDayScores.push(doneCnt / habits.length);
            }
        }
        const habitConsistency = habitDayScores.length > 0
            ? Math.round((habitDayScores.reduce((a, b) => a + b, 0) / habitDayScores.length) * 100)
            : 0;

        // ── 2. Planner Adherence (30%) ────────────────────────────────────
        // Average completion % across all blocks in last 7 planners
        let plannerAdherence = 0;
        if (planners.length > 0) {
            let totalBlocks = 0;
            let totalCompleted = 0;
            planners.forEach(p => {
                const planBlocks = p.blocks.filter((b: any) => b.plan && b.plan.trim() !== '');
                totalBlocks += planBlocks.length;
                totalCompleted += planBlocks.reduce((acc: number, b: any) => acc + (Number(b.completed) || 0), 0);
            });
            plannerAdherence = totalBlocks > 0 ? Math.round(totalCompleted / totalBlocks) : 0;
        }

        // ── 3. Streak Health (20%) ────────────────────────────────────────
        const streak = this.calculateStreak(journals);
        const streakScore = Math.min(100, Math.round((streak / 14) * 100));

        // ── 4. Task Velocity (10%) ────────────────────────────────────────
        const completedThisWeek = tasks.filter(t => {
            if (t.status !== 'done') return false;
            const updated = (t as any).updatedAt;
            if (!updated) return false;
            const diffDays = (Date.now() - new Date(updated).getTime()) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
        }).length;
        const openTasks = tasks.filter(t => t.status !== 'done').length;
        const velocityScore = openTasks > 0 ? Math.min(100, Math.round((completedThisWeek / Math.max(openTasks, 1)) * 100)) : (completedThisWeek > 0 ? 100 : 50);

        // ── Composite Score ───────────────────────────────────────────────
        const disciplineScore = Math.round(
            habitConsistency * 0.4 +
            plannerAdherence * 0.3 +
            streakScore * 0.2 +
            velocityScore * 0.1
        );

        // ── Failing Areas ─────────────────────────────────────────────────
        const failingHabits = habits
            .filter(h => {
                const doneLast3 = last3.filter(d => {
                    const logs = h.logs instanceof Map ? (h.logs as Map<string, any[]>).get(d) : (h.logs as any)?.[d];
                    return logs && Array.isArray(logs) && logs.length > 0;
                }).length;
                return doneLast3 === 0;
            })
            .map(h => ({ name: h.name, color: h.color, daysMissed: 3 }));

        const failingPlannerDays = planners
            .filter(p => {
                const planBlocks = p.blocks.filter((b: any) => b.plan && b.plan.trim() !== '');
                if (planBlocks.length === 0) return false;
                const avg = planBlocks.reduce((acc: number, b: any) => acc + (Number(b.completed) || 0), 0) / planBlocks.length;
                return avg < 50;
            })
            .map(p => ({ date: p.date, completion: Math.round(p.blocks.filter((b: any) => b.plan).reduce((acc: number, b: any) => acc + (Number(b.completed) || 0), 0) / Math.max(p.blocks.filter((b: any) => b.plan).length, 1)) }))
            .sort((a, b) => b.date.localeCompare(a.date))
            .slice(0, 5);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const stuckTasks = tasks
            .filter(t => {
                if (t.status === 'done') return false;
                const updated = (t as any).updatedAt;
                return updated && new Date(updated) < sevenDaysAgo;
            })
            .map(t => ({ title: t.title }))
            .slice(0, 5);

        return {
            disciplineScore,
            subScores: {
                habitConsistency,
                plannerAdherence,
                streakScore,
                velocityScore
            },
            streak,
            failingHabits,
            failingPlannerDays,
            stuckTasks,
            totalHabits: habits.length,
            totalTasks: tasks.length,
            completedThisWeek,
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
