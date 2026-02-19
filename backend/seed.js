const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = 'mongodb+srv://root:chintu@cluster0.alpyjmp.mongodb.net/tree-viz?appName=Cluster0';

// Define Schemas (Simplified for seeding)
const UserSchema = new mongoose.Schema({ username: { type: String, unique: true }, password: String }, { timestamps: true });
const TreeSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    children: Array,
    checked: { type: Boolean, default: false },
    toggled: { type: Boolean, default: false },
    status: { type: String, default: 'todo' },
    priority: { type: String, default: 'medium' },
    notes: { type: String, default: '' },
    dueDate: { type: String, default: '' }
}, { timestamps: true });
const TaskSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String, status: String, priority: String, dueDate: String }, { timestamps: true });
const JournalSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, date: String, title: String, content: String }, { timestamps: true });
const NoteSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, text: String, color: String }, { timestamps: true });
const PlannerSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    date: String,
    blocks: Array,
    summary: String
}, { timestamps: true });

const HabitSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    icon: { type: String, default: 'Zap' },
    color: { type: String, default: '#14b8a6' },
    logs: { type: Map, of: Boolean, default: {} }
}, { timestamps: true });

const RoutineSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    icon: { type: String, default: 'Sun' },
    blocks: Array
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Tree = mongoose.model('Tree', TreeSchema);
const Task = mongoose.model('Task', TaskSchema);
const Journal = mongoose.model('Journal', JournalSchema);
const Note = mongoose.model('Note', NoteSchema);
const Planner = mongoose.model('Planner', PlannerSchema);
const Habit = mongoose.model('Habit', HabitSchema);
const Routine = mongoose.model('Routine', RoutineSchema);

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Create Demo User
        const username = 'demo_user';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.deleteMany({ username });
        const user = await User.create({ username, password: hashedPassword });
        console.log('User created: demo_user / password123');

        const userId = user._id;

        // 2. Create Sample Trees (Roadmaps)
        await Tree.deleteMany({ userId });
        await Tree.create([
            {
                userId,
                name: 'Full Stack Mastery 2026',
                toggled: true,
                children: [
                    {
                        name: 'Frontend Excellence',
                        toggled: true,
                        children: [
                            {
                                name: 'Core React',
                                toggled: true,
                                children: [
                                    { name: 'React Hooks 深化', status: 'done', checked: true, priority: 'high', notes: 'Mastering useEffect, useMemo, and custom hooks' },
                                    { name: 'Concurrent Mode', status: 'in-progress', checked: false, priority: 'high' },
                                    { name: 'Server Components', status: 'todo', checked: false, priority: 'medium' }
                                ]
                            },
                            {
                                name: 'Styling & UX',
                                toggled: false,
                                children: [
                                    { name: 'Tailwind CSS Mastery', status: 'done', checked: true, priority: 'medium' },
                                    { name: 'Framer Motion Animations', status: 'in-progress', checked: false, priority: 'medium' },
                                    { name: 'Accessiblity (a11y)', status: 'todo', checked: false, priority: 'high' }
                                ]
                            },
                            { name: 'State Management (Zustand)', status: 'done', checked: true, priority: 'high' }
                        ]
                    },
                    {
                        name: 'Backend & Infrastructure',
                        toggled: true,
                        children: [
                            {
                                name: 'NestJS Ecosystem',
                                toggled: true,
                                children: [
                                    { name: 'Architecture & DI', status: 'done', checked: true, priority: 'high' },
                                    { name: 'Microservices with Redis', status: 'todo', checked: false, priority: 'high' },
                                    { name: 'GraphQL Integration', status: 'in-progress', checked: false, priority: 'medium' }
                                ]
                            },
                            {
                                name: 'Database Mastery',
                                toggled: false,
                                children: [
                                    { name: 'MongoDB Aggregation', status: 'done', checked: true, priority: 'high' },
                                    { name: 'PostgreSQL Performance', status: 'todo', checked: false, priority: 'medium' },
                                    { name: 'Redis Caching Strategies', status: 'in-progress', checked: false, priority: 'high' }
                                ]
                            }
                        ]
                    },
                    {
                        name: 'DevOps & Deployment',
                        toggled: false,
                        children: [
                            { name: 'Docker & Containerization', status: 'done', checked: true, priority: 'medium' },
                            { name: 'CI/CD Pipelines (GitHub Actions)', status: 'in-progress', checked: false, priority: 'high' },
                            { name: 'AWS Lambda & Serverless', status: 'todo', checked: false, priority: 'low' }
                        ]
                    }
                ]
            },
            {
                userId,
                name: 'Personal Growth & Habits',
                toggled: true,
                children: [
                    {
                        name: 'Physical Health',
                        toggled: true,
                        children: [
                            { name: 'Morning Yoga (15 min)', status: 'done', checked: true, priority: 'high' },
                            { name: 'Gym 4x/week', status: 'in-progress', checked: false, priority: 'medium' },
                            { name: 'Daily 10k Steps', status: 'in-progress', checked: false, priority: 'medium' }
                        ]
                    },
                    {
                        name: 'Learning',
                        toggled: true,
                        children: [
                            { name: 'Read 20 pages daily', status: 'in-progress', checked: false, priority: 'medium' },
                            { name: 'Spanish on Duolingo', status: 'done', checked: true, priority: 'low' }
                        ]
                    }
                ]
            }
        ]);
        console.log('Detailed roadmaps created');

        // 3. Create Sample Tasks
        await Task.deleteMany({ userId });
        await Task.insertMany([
            { userId, title: 'Fix CSS overlapping issues on mobile', status: 'done', priority: 'high', dueDate: '2026-02-15' },
            { userId, title: 'Integrate WebSockets for live tree sync', status: 'in-progress', priority: 'high', dueDate: '2026-02-18' },
            { userId, title: 'Write unit tests for Auth module', status: 'todo', priority: 'medium', dueDate: '2026-02-22' },
            { userId, title: 'Design new landing page concepts', status: 'todo', priority: 'low', dueDate: '2026-02-25' },
            { userId, title: 'Setup MongoDB sharding for production', status: 'in-progress', priority: 'high', dueDate: '2026-02-20' },
            { userId, title: 'Refactor navigation sidebar components', status: 'done', priority: 'medium', dueDate: '2026-02-17' },
            { userId, title: 'Optimize image loading performance', status: 'todo', priority: 'medium', dueDate: '2026-03-01' },
            { userId, title: 'Quarterly review presentation', status: 'todo', priority: 'high', dueDate: '2026-03-05' }
        ]);
        console.log('Sample tasks created');

        // 4. Create Sample Journal Entries
        await Journal.deleteMany({ userId });
        const todayDate = new Date();
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(todayDate.getDate() - i);
            dates.push(d.toISOString().split('T')[0]);
        }

        await Journal.insertMany([
            { userId, date: dates[0], title: 'Reflecting on Productive Week', content: 'Today was about consolidation. Finished the WebSocket integration and fixed several small UI bugs that were bothering me. Feeling 10/10.' },
            { userId, date: dates[1], title: 'WebSocket Breakthrough', content: 'Finally got the real-time sync working perfectly! The dashboard feels so much more alive now. Challenges with socket-io connection drops are resolved.' },
            { userId, date: dates[2], title: 'Deep Dive into NestJS Patterns', content: 'Spent the whole day refactoring the service layer. The dependency injection system in NestJS is truly powerful once you grasp it fully.' },
            { userId, date: dates[3], title: 'UI Overhaul Started', content: 'Met with the design team. We decided to move towards a more glassmorphism look for the tree nodes. Implementing the first prototype today.' },
            { userId, date: dates[4], title: 'Bug Hunting Session', content: 'Found a nasty race condition in the state management. Fixed it with a properly implemented mutex in the backend.' },
            { userId, date: dates[5], title: 'Starting the Tree-Viz project', content: `Drafted the initial architecture. Decided on a monorepo structure with NestJS and React. Excited for what's to come!` },
            { userId, date: dates[6], title: 'Initial Idea Generation', content: `Thinking about how to visualize complex roadmaps as trees. Looking at Framer Motion for smooth transitions.` }
        ]);
        console.log('Sample journal entries created');

        // 5. Create Sample Notes
        await Note.deleteMany({ userId });
        await Note.insertMany([
            { userId, text: 'Remember to use HSL for dynamic color generation in the tree view to ensure consistent branding.', color: '#fef3c7' },
            { userId, text: 'Check out NestJS Interceptors for a cleaner API response structure across all controllers.', color: '#bae6fd' },
            { userId, text: 'Meeting with UI/UX team at 5 PM on Friday to discuss the new dashboard layout.', color: '#bbf7d0' },
            { userId, text: 'Check performance on mobile devices after adding the heavy animations.', color: '#fecaca' },
            { userId, text: 'Project API Keys: [REDACTED FOR DEMO]', color: '#e9d5ff' },
            { userId, text: 'Read the latest post on React 19 features, especially the new useHook.', color: '#fed7aa' }
        ]);
        console.log('Sample notes created');

        // 6. Create Sample Planner for 3 days
        await Planner.deleteMany({ userId });

        const createBlocks = (dayType) => {
            const b = [];
            for (let i = 6; i < 24; i++) {
                const hour = i < 10 ? `0${i}:00` : `${i}:00`;
                const nextHour = (i + 1) < 10 ? `0${i + 1}:00` : `${(i + 1)}:00`;
                let plan = '';
                let reality = '';
                let completed = false;

                if (dayType === 'productive') {
                    if (i === 7) { plan = 'Yoga & Meditation'; reality = 'Did 20 mins of Sun Salutations.'; completed = true; }
                    if (i === 9) { plan = 'Morning Standup'; reality = 'Briefed team on progress.'; completed = true; }
                    if (i === 10) { plan = 'Deep Work: Backend'; reality = 'Implemented JWT verification.'; completed = true; }
                    if (i === 13) { plan = 'Lunch & Walk'; reality = 'Healthy salad and 2km walk.'; completed = true; }
                    if (i === 15) { plan = 'Feature Testing'; reality = 'Tested WebSocket edge cases.'; completed = true; }
                    if (i === 20) { plan = 'Reading'; reality = 'Finished 1 chapter of Atomic Habits.'; completed = true; }
                } else if (dayType === 'busy') {
                    if (i === 8) { plan = 'Commute & Emails'; reality = 'Inbox zero achieved.'; completed = true; }
                    if (i === 10) { plan = 'Client Meeting'; reality = 'They loved the tree visualization!'; completed = true; }
                    if (i === 12) { plan = 'Quick Lunch'; reality = 'Working lunch at the desk.'; completed = true; }
                    if (i === 14) { plan = 'API Documentation'; reality = 'Documented 50% of the routes.'; completed = false; }
                    if (i === 17) { plan = 'Code Review'; reality = 'Reviewed 10 PRs.'; completed = true; }
                    if (i === 21) { plan = 'Relaxation'; reality = 'Watched a documentary.'; completed = true; }
                } else {
                    if (i === 10) { plan = 'Planning Session'; reality = 'Drafted next sprint goals.'; completed = true; }
                    if (i === 14) { plan = 'Workshop'; reality = 'Attended React performance workshop.'; completed = true; }
                    if (i === 20) { plan = 'Side Project'; reality = 'Started work on the mobile app.'; completed = true; }
                }

                b.push({ startTime: hour, endTime: nextHour, plan, reality, completed });
            }
            return b;
        };

        await Planner.create([
            { userId, date: dates[0], blocks: createBlocks('productive'), summary: 'One of the most productive days this month. Hit all key milestones.' },
            { userId, date: dates[1], blocks: createBlocks('busy'), summary: 'Extremely busy with meetings, but made good architectural decisions.' },
            { userId, date: dates[2], blocks: createBlocks('normal'), summary: 'Consistent progress. Workshop was very eye-opening.' }
        ]);
        console.log('Detailed planner data created for 3 days');

        // 7. Create Sample Habits
        await Habit.deleteMany({ userId });
        const habitLogs = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date();
            d.setDate(todayDate.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            if (Math.random() > 0.3) habitLogs[dateStr] = true;
        }

        await Habit.insertMany([
            {
                userId,
                name: 'Morning Meditation',
                icon: 'Sprout',
                color: '#10b981',
                logs: habitLogs
            },
            {
                userId,
                name: 'Read 30 mins',
                icon: 'BookOpen',
                color: '#3b82f6',
                logs: Object.fromEntries(Object.entries(habitLogs).filter(() => Math.random() > 0.5))
            },
            {
                userId,
                name: 'Workout',
                icon: 'Dumbbell',
                color: '#ef4444',
                logs: Object.fromEntries(Object.entries(habitLogs).filter(() => Math.random() > 0.6))
            },
            {
                userId,
                name: 'Write Code',
                icon: 'Code',
                color: '#8b5cf6',
                logs: habitLogs
            }
        ]);
        console.log('Sample habits created');

        // 8. Create Sample Routines
        await Routine.deleteMany({ userId });
        await Routine.create([
            {
                userId,
                name: 'Standard Workday',
                icon: 'Briefcase',
                blocks: [
                    { startTime: '08:00', endTime: '09:00', plan: 'Morning Routine & Coffee', tag: 'Personal' },
                    { startTime: '09:00', endTime: '12:00', plan: 'Deep Work Session 1', tag: 'Work' },
                    { startTime: '12:00', endTime: '13:00', plan: 'Lunch & Break', tag: 'Personal' },
                    { startTime: '13:00', endTime: '15:00', plan: 'Meetings & Admin', tag: 'Work' },
                    { startTime: '15:00', endTime: '17:00', plan: 'Deep Work Session 2', tag: 'Work' }
                ]
            },
            {
                userId,
                name: 'Weekend Recharge',
                icon: 'Coffee',
                blocks: [
                    { startTime: '10:00', endTime: '11:00', plan: 'Late Breakfast', tag: 'Personal' },
                    { startTime: '11:00', endTime: '14:00', plan: 'Outdoor Activity', tag: 'Personal' },
                    { startTime: '14:00', endTime: '16:00', plan: 'Skill Learning', tag: 'Learning' },
                    { startTime: '16:00', endTime: '19:00', plan: 'Hobbies', tag: 'Personal' }
                ]
            }
        ]);
        console.log('Sample routines created');

        console.log('Seeding finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
