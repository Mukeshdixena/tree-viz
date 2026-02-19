import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User } from '../auth/schemas/user.schema';
import { Habit } from '../habit/schemas/habit.schema';
import { Planner } from '../planner/schemas/planner.schema';
import { Task } from '../task/schemas/task.schema';

@Injectable()
export class SeedService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(Habit.name) private habitModel: Model<Habit>,
        @InjectModel(Planner.name) private plannerModel: Model<Planner>,
        @InjectModel(Task.name) private taskModel: Model<Task>,
    ) { }

    async seedDemoUser() {
        const username = 'demo_user';
        const hashedPassword = await bcrypt.hash('demo123', 10);

        let user = await this.userModel.findOne({ username });
        if (!user) {
            user = new this.userModel({ username, password: hashedPassword });
            await user.save();
        }

        const userId = user._id;

        // 1. Seed Habits
        const demoHabits = [
            { name: 'Morning Meditation', icon: 'Zap', color: '#8b5cf6' },
            { name: 'Drink 3L Water', icon: 'Zap', color: '#3b82f6' },
            { name: '1h Deep Work', icon: 'Target', color: '#14b8a6' },
            { name: 'Evening Reading', icon: 'BookOpen', color: '#f59e0b' }
        ];

        for (const h of demoHabits) {
            await this.habitModel.findOneAndUpdate(
                { userId, name: h.name },
                { $set: h },
                { upsert: true }
            );
        }

        // 2. Seed Tasks
        const demoTasks = [
            { title: 'Complete Project Documentation', status: 'in-progress', priority: 'high' },
            { title: 'Refactor Auth Service', status: 'todo', priority: 'medium' },
            { title: 'Setup CI/CD Pipeline', status: 'todo', priority: 'low' },
            { title: 'Call Client for Feedback', status: 'done', priority: 'medium' }
        ];

        for (const t of demoTasks) {
            await this.taskModel.findOneAndUpdate(
                { userId, title: t.title },
                { $set: t },
                { upsert: true }
            );
        }

        // 3. Seed Planner for Today
        const today = new Date().toISOString().split('T')[0];
        const blocks = [];
        for (let i = 0; i < 24; i++) {
            const h = i.toString().padStart(2, '0');
            const eh = ((i + 1) % 24).toString().padStart(2, '0');
            let plan = '';
            if (i < 7 || i >= 23) plan = 'Sleep';
            else if (i === 8) plan = 'Morning Routine';
            else if (i >= 9 && i < 13) plan = 'Deep Work Session';
            else if (i === 13) plan = 'Lunch Break';
            else if (i >= 14 && i < 17) plan = 'Collaboration / Meetings';
            else if (i === 17) plan = 'Exercise';
            else if (i === 19) plan = 'Personal Projects';

            blocks.push({
                startTime: `${h}:00`,
                endTime: `${eh}:00`,
                plan,
                completed: i < new Date().getHours() && plan !== ''
            });
        }

        await this.plannerModel.findOneAndUpdate(
            { userId, date: today },
            { $set: { blocks, summary: 'A productive day focused on deep work and health.' } },
            { upsert: true }
        );

        return { message: 'Demo data seeded successfully', user: { username, password: 'demo123' } };
    }
}
