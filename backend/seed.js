const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGO_URI = 'mongodb+srv://root:chintu@cluster0.alpyjmp.mongodb.net/tree-viz?appName=Cluster0';

// Define Schemas (Simplified for seeding)
const UserSchema = new mongoose.Schema({ username: { type: String, unique: true }, password: String });
const TreeSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, name: String, children: Array, checked: Boolean, toggled: Boolean });
const TaskSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String, status: String, priority: String, dueDate: String });
const JournalSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, date: String, title: String, content: String });
const NoteSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, text: String, color: String });
const PlannerSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    date: String,
    blocks: Array,
    summary: String
});

const User = mongoose.model('User', UserSchema);
const Tree = mongoose.model('Tree', TreeSchema);
const Task = mongoose.model('Task', TaskSchema);
const Journal = mongoose.model('Journal', JournalSchema);
const Note = mongoose.model('Note', NoteSchema);
const Planner = mongoose.model('Planner', PlannerSchema);

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
        await Tree.create({
            userId,
            name: 'Full Stack Mastery',
            toggled: true,
            children: [
                {
                    name: 'Frontend',
                    toggled: true,
                    children: [
                        { name: 'React Hooks', status: 'done', checked: true, priority: 'high', notes: 'Mastering useEffect and useMemo' },
                        { name: 'Framer Motion', status: 'in-progress', checked: false, priority: 'medium' }
                    ]
                },
                {
                    name: 'Backend',
                    toggled: true,
                    children: [
                        { name: 'NestJS Basics', status: 'done', checked: true, priority: 'high' },
                        { name: 'WebSockets', status: 'in-progress', checked: false, priority: 'high', notes: 'Implementing real-time sync' }
                    ]
                }
            ]
        });
        console.log('Sample roadmap created');

        // 3. Create Sample Tasks
        await Task.deleteMany({ userId });
        await Task.insertMany([
            { userId, title: 'Fix CSS overlapping issues', status: 'done', priority: 'high', dueDate: '2026-02-15' },
            { userId, title: 'Integrate WebSockets for live sync', status: 'in-progress', priority: 'high', dueDate: '2026-02-16' },
            { userId, title: 'Write unit tests for Auth module', status: 'todo', priority: 'medium', dueDate: '2026-02-20' },
            { userId, title: 'Design new landing page', status: 'todo', priority: 'low', dueDate: '2026-02-25' }
        ]);
        console.log('Sample tasks created');

        // 4. Create Sample Journal Entries
        await Journal.deleteMany({ userId });
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const dayBefore = new Date(Date.now() - 172800000).toISOString().split('T')[0];

        await Journal.insertMany([
            { userId, date: dayBefore, title: 'Starting the Tree-Viz project', content: 'Today I sketched the architecture. Planning to use NestJS and React.' },
            { userId, date: yesterday, title: 'Mastering NestJS', content: 'Implemented the auth module today. Mongoose integration was smooth.' },
            { userId, date: today, title: 'WebSocket Breakthrough', content: 'Finally got the real-time sync working. The dashboard looks alive now!' }
        ]);
        console.log('Sample journal entries created');

        // 5. Create Sample Notes
        await Note.deleteMany({ userId });
        await Note.insertMany([
            { userId, text: 'Remember to use HSL for dynamic color generation in the tree view.', color: '#fef3c7' },
            { userId, text: 'Check out NestJS Interceptors for a cleaner API response structure.', color: '#bae6fd' },
            { userId, text: 'Meeting with UI/UX team at 5 PM on Friday.', color: '#bbf7d0' }
        ]);
        console.log('Sample notes created');

        // 6. Create Sample Planner
        await Planner.deleteMany({ userId });
        const blocks = [];
        for (let i = 6; i < 24; i++) {
            const hour = i < 10 ? `0${i}:00` : `${i}:00`;
            const nextHour = (i + 1) < 10 ? `0${i + 1}:00` : `${(i + 1)}:00`;
            let plan = '';
            let reality = '';
            let completed = false;

            if (i === 9) { plan = 'Morning Standup'; reality = 'Discussed blocking issues with the team.'; completed = true; }
            if (i === 10) { plan = 'Code Review'; reality = 'Reviewed 5 PRs. Found some memory leaks.'; completed = true; }
            if (i === 11) { plan = 'Deep Work: Feature A'; reality = 'Implemented core logic but tests are failing.'; completed = false; }
            if (i === 13) { plan = 'Lunch Break'; reality = 'Had a quick salad and walked for 15 mins.'; completed = true; }

            blocks.push({
                startTime: hour,
                endTime: nextHour,
                plan,
                reality,
                completed
            });
        }
        await Planner.create({ userId, date: today, blocks, summary: 'Productive morning, but distractions in the afternoon.' });
        console.log('Sample planner data created');

        console.log('Seeding finished successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding failed:', err);
        process.exit(1);
    }
}

seed();
