require('dotenv').config();
const mongoose = require('mongoose');
const MONGO_URI = process.env.MONGO_URI;

const UserSchema = new mongoose.Schema({ username: { type: String, unique: true }, password: String });
const TreeSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, name: String });
const TaskSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String });
const JournalSchema = new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId, title: String });

const User = mongoose.model('User', UserSchema);
const Tree = mongoose.model('Tree', TreeSchema);
const Task = mongoose.model('Task', TaskSchema);
const Journal = mongoose.model('Journal', JournalSchema);

async function check() {
    try {
        await mongoose.connect(MONGO_URI);
        const user = await User.findOne({ username: 'demo_user' });
        if (!user) {
            console.log('User demo_user not found');
        } else {
            console.log('User found:', user._id);
            const trees = await Tree.countDocuments({ userId: user._id });
            const tasks = await Task.countDocuments({ userId: user._id });
            const journals = await Journal.countDocuments({ userId: user._id });
            console.log(`Data for demo_user: Trees:${trees}, Tasks:${tasks}, Journals:${journals}`);
        }
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
