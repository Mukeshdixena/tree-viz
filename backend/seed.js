/**
 * seed.js — Clear all collections and seed one demo user with rich data.
 * Run from the backend directory:
 *   node seed.js
 *
 * Requires: mongoose, bcrypt  (already in backend dependencies)
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// ── MongoDB URI ────────────────────────────────────────────────────────────────
const MONGO_URI = 'mongodb+srv://root:chintu@cluster0.alpyjmp.mongodb.net/tree-viz?appName=Cluster0';

// ── Helpers ────────────────────────────────────────────────────────────────────
function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return d.toISOString().slice(0, 10); // "YYYY-MM-DD"
}
function dateStr(n = 0) { return daysAgo(n); }

// ── Schemas (plain mongoose — no NestJS decorators needed) ──────────────────
const { Schema, model, Types } = mongoose;

const UserSchema = new Schema({ username: String, password: String }, { timestamps: true });

const TaskSchema = new Schema({
    userId: Types.ObjectId,
    title: String,
    status: { type: String, default: 'todo' },
    priority: { type: String, default: 'medium' },
    dueDate: String,
    targetType: { type: String, default: 'none' },
    targetValue: { type: String, default: '' },
    targetTotal: { type: Number, default: 0 },
    targetCurrent: { type: Number, default: 0 },
}, { timestamps: true });

const TreeSchema = new Schema({
    userId: Types.ObjectId,
    name: String,
    children: { type: Array, default: [] },
    checked: { type: Boolean, default: false },
    toggled: { type: Boolean, default: false },
    status: { type: String, default: 'todo' },
    priority: { type: String, default: 'medium' },
    notes: { type: String, default: '' },
    links: { type: Array, default: [] },
    dueDate: { type: String, default: '' },
}, { timestamps: true });

const HabitLogEntrySchema = new Schema({ value: Number, timestamp: String });
const HabitSchema = new Schema({
    userId: Types.ObjectId,
    name: String,
    icon: { type: String, default: '⭐' },
    color: { type: String, default: '#14b8a6' },
    trackingType: { type: String, default: 'none' },
    logs: { type: Map, of: [HabitLogEntrySchema], default: {} },
}, { timestamps: true });

const JournalSchema = new Schema({
    userId: Types.ObjectId,
    date: String,
    title: String,
    content: String,
}, { timestamps: true });

const NoteSchema = new Schema({
    userId: Types.ObjectId,
    text: { type: String, default: '' },
    color: { type: String, default: '#fef3c7' },
}, { timestamps: true });

const TimeBlockSchema = new Schema({
    startTime: String,
    endTime: String,
    plan: { type: String, default: '' },
    reality: { type: String, default: '' },
    completed: { type: Number, default: 0 },
    taskId: String,
    progressMade: { type: String, default: '' },
});
const DayTaskSchema = new Schema({ title: String, done: Boolean });
const PlannerSchema = new Schema({
    userId: Types.ObjectId,
    date: String,
    wakeUpTime: { type: String, default: '' },
    blocks: { type: [TimeBlockSchema], default: [] },
    dayTasks: { type: [DayTaskSchema], default: [] },
}, { timestamps: true });
PlannerSchema.index({ userId: 1, date: 1 }, { unique: true });

const RoutineBlockSchema = new Schema({ startTime: String, endTime: String, plan: String, tag: String, target: String });
const RoutineSchema = new Schema({
    userId: Types.ObjectId,
    name: String,
    icon: { type: String, default: 'Sun' },
    blocks: { type: [RoutineBlockSchema], default: [] },
}, { timestamps: true });
RoutineSchema.index({ userId: 1, name: 1 }, { unique: true });

// Register models
const User = model('User', UserSchema);
const Task = model('Task', TaskSchema);
const Tree = model('Tree', TreeSchema);
const Habit = model('Habit', HabitSchema);
const Journal = model('Journal', JournalSchema);
const Note = model('Note', NoteSchema);
const Planner = model('Planner', PlannerSchema);
const Routine = model('Routine', RoutineSchema);

// ── Seed ──────────────────────────────────────────────────────────────────────
async function seed() {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected.');

    // ── 1. Clear everything ──────────────────────────────────────────────────
    console.log('Dropping all collections...');
    await Promise.all([
        User.deleteMany({}),
        Task.deleteMany({}),
        Tree.deleteMany({}),
        Habit.deleteMany({}),
        Journal.deleteMany({}),
        Note.deleteMany({}),
        Planner.deleteMany({}),
        Routine.deleteMany({}),
    ]);
    console.log('All collections cleared.');

    // ── 2. Create demo user ──────────────────────────────────────────────────
    const hashed = await bcrypt.hash('demo123', 10);
    const user = await User.create({ username: 'demo', password: hashed });
    const uid = user._id;
    console.log(`Created user: demo / demo123  (id: ${uid})`);

    // ── 3. Tasks ─────────────────────────────────────────────────────────────
    await Task.create([
        { userId: uid, title: 'Set up development environment', status: 'done', priority: 'high', dueDate: dateStr(10), updatedAt: new Date(Date.now() - 9 * 86400000) },
        { userId: uid, title: 'Complete DSA chapter — Graphs', status: 'done', priority: 'high', dueDate: dateStr(6), updatedAt: new Date(Date.now() - 5 * 86400000) },
        { userId: uid, title: 'Build REST API endpoints', status: 'done', priority: 'high', dueDate: dateStr(4), updatedAt: new Date(Date.now() - 3 * 86400000) },
        { userId: uid, title: 'Write unit tests for auth module', status: 'done', priority: 'medium', dueDate: dateStr(3), updatedAt: new Date(Date.now() - 2 * 86400000) },
        { userId: uid, title: 'Review System Design: Distributed Systems', status: 'in-progress', priority: 'high', dueDate: dateStr(-2) },
        { userId: uid, title: 'Practice LeetCode — 2 problems/day', status: 'in-progress', priority: 'high', dueDate: dateStr(-1), targetType: 'count', targetValue: '60 problems', targetTotal: 60, targetCurrent: 22 },
        { userId: uid, title: 'Complete React advanced patterns course', status: 'in-progress', priority: 'medium', dueDate: dateStr(-5), targetType: 'time', targetValue: '20 hours', targetTotal: 20, targetCurrent: 11 },
        { userId: uid, title: 'Update portfolio website', status: 'todo', priority: 'medium', dueDate: dateStr(-7) },
        { userId: uid, title: 'Read: Clean Code by Robert Martin', status: 'todo', priority: 'low' },
        { userId: uid, title: 'Set up CI/CD pipeline', status: 'todo', priority: 'medium', dueDate: dateStr(-10) },
        { userId: uid, title: 'Prepare mock interview questions', status: 'todo', priority: 'high', dueDate: dateStr(-3) },
        // stale in-progress (no update in 7+ days — detected by discipline system)
        { userId: uid, title: 'Refactor legacy codebase module', status: 'in-progress', priority: 'low', updatedAt: new Date(Date.now() - 12 * 86400000) },
    ]);
    console.log('Tasks seeded.');

    // ── 4. Roadmap Tree ──────────────────────────────────────────────────────
    await Tree.create([
        {
            userId: uid,
            name: 'Full-Stack Engineering Roadmap',
            status: 'in-progress',
            priority: 'high',
            notes: 'My 6-month plan to become a senior engineer.',
            toggled: true,
            children: [
                {
                    name: 'Frontend',
                    status: 'in-progress',
                    toggled: true,
                    children: [
                        { name: 'HTML & CSS Mastery', status: 'done', checked: true },
                        { name: 'JavaScript Deep Dive', status: 'done', checked: true },
                        { name: 'React — Hooks, Context, Performance', status: 'in-progress', checked: false },
                        { name: 'TypeScript Fundamentals', status: 'todo', checked: false },
                        { name: 'Testing: Vitest + RTL', status: 'todo', checked: false },
                    ],
                },
                {
                    name: 'Backend',
                    status: 'in-progress',
                    toggled: true,
                    children: [
                        { name: 'Node.js + Express', status: 'done', checked: true },
                        { name: 'NestJS Framework', status: 'in-progress', checked: false },
                        { name: 'REST API Design', status: 'done', checked: true },
                        { name: 'GraphQL', status: 'todo', checked: false },
                    ],
                },
                {
                    name: 'Databases',
                    status: 'in-progress',
                    children: [
                        { name: 'MongoDB', status: 'done', checked: true },
                        { name: 'PostgreSQL', status: 'todo', checked: false },
                        { name: 'Redis Caching', status: 'todo', checked: false },
                    ],
                },
                {
                    name: 'DevOps & Deployment',
                    status: 'todo',
                    children: [
                        { name: 'Docker & Containerization', status: 'todo' },
                        { name: 'CI/CD with GitHub Actions', status: 'todo' },
                        { name: 'AWS / GCP Basics', status: 'todo' },
                    ],
                },
            ],
        },
        {
            userId: uid,
            name: 'DSA & Competitive Programming',
            status: 'in-progress',
            priority: 'high',
            toggled: true,
            children: [
                { name: 'Arrays & Strings', status: 'done', checked: true },
                { name: 'Linked Lists & Stacks', status: 'done', checked: true },
                { name: 'Trees & Graphs', status: 'in-progress' },
                { name: 'Dynamic Programming', status: 'todo' },
                { name: 'Greedy Algorithms', status: 'todo' },
            ],
        },
    ]);
    console.log('Trees seeded.');

    // ── 5. Habits ─────────────────────────────────────────────────────────────
    function buildLogs(presentDays) {
        const logs = {};
        presentDays.forEach(n => {
            const key = dateStr(n);
            logs[key] = [{ value: 1, timestamp: new Date(Date.now() - n * 86400000).toISOString() }];
        });
        return logs;
    }

    await Habit.create([
        {
            userId: uid, name: 'Morning Workout', icon: '💪', color: '#ef4444', trackingType: 'none',
            logs: buildLogs([0, 1, 2, 3, 5, 6, 7, 9]),
        },
        {
            userId: uid, name: 'LeetCode Practice', icon: '🧠', color: '#6366f1', trackingType: 'count',
            logs: buildLogs([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]),
        },
        {
            userId: uid, name: 'Reading (30 min)', icon: '📚', color: '#f59e0b', trackingType: 'hours',
            logs: buildLogs([0, 1, 3, 6]),
        },
        {
            userId: uid, name: 'Meditation', icon: '🧘', color: '#10b981', trackingType: 'none',
            logs: buildLogs([0, 2, 5, 7]),
        },
        {
            userId: uid, name: 'Cold Shower', icon: '🚿', color: '#3b82f6', trackingType: 'none',
            logs: buildLogs([4, 5, 6, 7, 8, 9]),  // missed last 4 days → failing
        },
        {
            userId: uid, name: 'No Social Media', icon: '📵', color: '#8b5cf6', trackingType: 'none',
            logs: buildLogs([5, 6, 7, 8, 9]),  // missed last 5 days → failing
        },
    ]);
    console.log('Habits seeded.');

    // ── 6. Journal Entries ────────────────────────────────────────────────────
    const journalEntries = [
        { date: dateStr(9), title: 'Starting fresh', content: 'Today I decided to take my discipline seriously. Set up my routine and planned the week ahead. Feeling motivated — hope I can keep this up.' },
        { date: dateStr(8), title: 'Good momentum', content: 'Completed all my habits today. Solved 2 LeetCode problems (medium difficulty). Feeling sharp. Need to keep this going.' },
        { date: dateStr(7), title: 'Tough but productive', content: 'Struggled with the workout this morning but pushed through. Spent 3 hours on React advanced patterns. Progress feels slow but it\'s compounding.' },
        { date: dateStr(6), title: 'Graph algorithms clicking', content: 'BFS/DFS finally makes sense after the 10th problem. Finished the Trees & Graphs section. Main insight: always think about the state space first.' },
        { date: dateStr(5), title: 'Rest day reflection', content: 'Took a mental health day. Light reading only. I think sustainable momentum matters more than grinding every day. Reset for tomorrow.' },
        { date: dateStr(4), title: 'Back on track', content: 'Full session: workout, LeetCode, 90 min study. Built out the REST endpoints for the side project. Good day.' },
        { date: dateStr(3), title: 'Discipline is a muscle', content: 'Didn\'t feel like it but did it anyway. That\'s the whole point. 3-problem LeetCode session. Meditation before sleep made a huge difference.' },
        { date: dateStr(2), title: 'NestJS progress', content: 'Got deeper into NestJS dependency injection. The architecture is elegant once you understand why it\'s structured that way. Missing the cold showers though.' },
        { date: dateStr(1), title: 'Mid-week check-in', content: 'Discipline score is improving. Biggest gap is consistency on meditation and cold showers. Setting a morning alarm reminder tomorrow.' },
        { date: dateStr(0), title: 'Today\'s plan', content: 'Going to nail all 6 habits today. LeetCode at 7am, workout at 8am, study session 9-12, afternoon open. Let\'s go.' },
    ];
    await Journal.create(journalEntries.map(j => ({ userId: uid, ...j })));
    console.log('Journal entries seeded.');

    // ── 7. Notes ─────────────────────────────────────────────────────────────
    await Note.create([
        { userId: uid, text: '# System Design Notes\n\n## CAP Theorem\n- Consistency, Availability, Partition Tolerance\n- Pick 2 in distributed systems\n\n## Redis use cases\n- Session caching\n- Rate limiting\n- Pub/Sub messaging', color: '#dbeafe' },
        { userId: uid, text: '## LeetCode Patterns\n- Sliding Window\n- Two Pointer\n- Fast & Slow Pointer\n- Merge Intervals\n- Tree BFS/DFS\n- Dynamic Programming', color: '#fef3c7' },
        { userId: uid, text: 'Interview Prep Checklist\n\n✅ Behavioral stories (STAR)\n☐ System design (3 scenarios)\n☐ 50 medium LeetCode\n☐ Mock interview x2', color: '#dcfce7' },
        { userId: uid, text: 'Books to read:\n- Clean Code\n- The Pragmatic Programmer\n- Designing Data-Intensive Apps\n- A Philosophy of Software Design', color: '#fce7f3' },
    ]);
    console.log('Notes seeded.');

    // ── 8. Planner Entries (last 7 days) ─────────────────────────────────────
    const planners = [];
    const wakeUps = ['05:45', '06:00', '05:30', '06:30', '06:15', '05:45', '06:00'];
    for (let i = 6; i >= 0; i--) {
        const isoDate = dateStr(i);
        const isWeekend = [0, 6].includes(new Date(isoDate).getDay());
        // Days 4 & 5 are intentionally low (<50%) to trigger failing planner detection
        const baseCompletion = i === 0 ? 0 : i === 4 ? 30 : i === 5 ? 40 : 78 + Math.floor(Math.random() * 18);

        planners.push({
            userId: uid,
            date: isoDate,
            wakeUpTime: wakeUps[i] || '06:00',
            blocks: isWeekend ? [
                { startTime: '08:00', endTime: '09:30', plan: 'Morning workout + breakfast', reality: i > 0 ? 'Completed full session' : '', completed: i > 0 ? 90 : 0 },
                { startTime: '10:00', endTime: '12:00', plan: 'Personal project work', reality: i > 0 ? 'Built 2 features' : '', completed: i > 0 ? baseCompletion : 0 },
                { startTime: '14:00', endTime: '16:00', plan: 'Study / reading', reality: i > 0 ? 'Read 50 pages' : '', completed: i > 0 ? baseCompletion : 0 },
            ] : [
                { startTime: '05:45', endTime: '06:30', plan: 'Morning routine (workout, cold shower, meditation)', reality: i > 0 ? 'Did workout + cold shower, skipped meditation' : '', completed: i > 0 ? 70 : 0 },
                { startTime: '07:00', endTime: '08:00', plan: 'LeetCode — 2 problems', reality: i > 0 ? 'Solved 2 medium problems' : '', completed: i > 0 ? 100 : 0 },
                { startTime: '08:30', endTime: '11:30', plan: 'Deep work: NestJS / Backend concepts', reality: i > 0 ? 'Covered DI, Guards, Interceptors' : '', completed: i > 0 ? baseCompletion : 0 },
                { startTime: '12:00', endTime: '13:00', plan: 'Lunch + break', reality: i > 0 ? 'Lunch, short walk' : '', completed: i > 0 ? 100 : 0 },
                { startTime: '13:30', endTime: '15:30', plan: 'React / Frontend study', reality: i > 0 ? 'Advanced hooks and performance patterns' : '', completed: i > 0 ? baseCompletion : 0 },
                { startTime: '16:00', endTime: '17:00', plan: 'Review + journal', reality: i > 0 ? 'Wrote journal entry, reviewed day' : '', completed: i > 0 ? baseCompletion : 0 },
                { startTime: '21:00', endTime: '22:00', plan: 'Reading (Clean Code)', reality: i > 0 ? 'Read 30 pages' : '', completed: i > 0 ? 80 : 0 },
            ],
            dayTasks: [
                { title: 'Solve 2 LeetCode problems', done: i > 0 },
                { title: 'Study 3 hours', done: i > 2 },
                { title: 'Complete all habits', done: i > 3 },
            ],
        });
    }
    await Planner.insertMany(planners, { ordered: false }).catch(err => console.warn('Planner insert warning:', err.message));
    console.log('Planner entries seeded.');

    // ── 9. Routine ───────────────────────────────────────────────────────────
    await Routine.create({
        userId: uid,
        name: 'Weekday Warrior',
        icon: 'Sun',
        blocks: [
            { startTime: '05:30', endTime: '06:30', plan: 'Morning workout', tag: 'health', target: 'Every day' },
            { startTime: '06:30', endTime: '07:00', plan: 'Cold shower + meditation', tag: 'health', target: 'Every day' },
            { startTime: '07:00', endTime: '08:00', plan: 'LeetCode (2 problems)', tag: 'coding', target: '2 problems' },
            { startTime: '08:30', endTime: '12:00', plan: 'Deep study block', tag: 'study', target: '3.5 hours' },
            { startTime: '13:00', endTime: '15:00', plan: 'Project work', tag: 'coding', target: '2 hours' },
            { startTime: '15:30', endTime: '16:30', plan: 'Reading', tag: 'learning', target: '30+ pages' },
            { startTime: '21:00', endTime: '22:00', plan: 'Journal + plan tomorrow', tag: 'reflection', target: 'Every night' },
        ],
    });
    console.log('Routine seeded.');

    // ── Done ─────────────────────────────────────────────────────────────────
    console.log('\n=============================================');
    console.log('  Seed complete!');
    console.log('  Login: demo / demo123');
    console.log('  Collections:');
    console.log('    Users:    1');
    console.log('    Tasks:    12');
    console.log('    Trees:    2 (nested roadmaps)');
    console.log('    Habits:   6 (2 failing — shows discipline gaps)');
    console.log('    Journals: 10 (10-day streak)');
    console.log('    Notes:    4');
    console.log('    Planners: 7 (last 7 days, 2 poor days for discipline demo)');
    console.log('    Routines: 1');
    console.log('=============================================');

    await mongoose.disconnect();
    process.exit(0);
}

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
