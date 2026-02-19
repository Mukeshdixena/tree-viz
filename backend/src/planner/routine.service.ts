import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Routine } from './schemas/routine.schema';

@Injectable()
export class RoutineService {
    constructor(@InjectModel(Routine.name) private routineModel: Model<Routine>) { }

    async findAll(userId: string): Promise<Routine[]> {
        return this.routineModel.find({ userId: new Types.ObjectId(userId) }).exec();
    }

    async create(userId: string, data: any): Promise<Routine> {
        const newRoutine = new this.routineModel({
            ...data,
            userId: new Types.ObjectId(userId)
        });
        return newRoutine.save();
    }

    async update(userId: string, id: string, data: any): Promise<Routine> {
        return this.routineModel.findOneAndUpdate(
            { _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) },
            { $set: data },
            { new: true }
        ).exec();
    }

    async delete(userId: string, id: string): Promise<any> {
        return this.routineModel.deleteOne({
            _id: new Types.ObjectId(id),
            userId: new Types.ObjectId(userId)
        }).exec();
    }

    async seedDefaults(userId: string): Promise<void> {
        const count = await this.routineModel.countDocuments({ userId: new Types.ObjectId(userId) });
        if (count === 0) {
            const generateFullDay = (name, icon, overrides = {}) => {
                const blocks = [];
                for (let i = 0; i < 24; i++) {
                    const startH = i.toString().padStart(2, '0');
                    const endH = ((i + 1) % 24).toString().padStart(2, '0');
                    const time = `${startH}:00`;

                    let block = {
                        startTime: time,
                        endTime: `${endH}:00`,
                        plan: i < 7 || i >= 23 ? 'Sleep' : '',
                        tag: i < 7 || i >= 23 ? 'rest' : 'none',
                        target: ''
                    };

                    if (overrides[time]) {
                        block = { ...block, ...overrides[time] };
                    }

                    blocks.push(block);
                }
                return { name, icon, blocks };
            };

            const weekdayOverrides = {
                "07:00": { plan: "Morning Routine", tag: 'rest', target: '1h' },
                "08:00": { plan: "DSA Practice", tag: 'dsa', target: '5 problems' },
                "09:00": { plan: "Primary Work Block", tag: 'work', target: '4h focus' },
                "10:00": { plan: "Primary Work Block", tag: 'work', target: '4h focus' },
                "11:00": { plan: "Primary Work Block", tag: 'work', target: '4h focus' },
                "12:00": { plan: "Primary Work Block", tag: 'work', target: '4h focus' },
                "13:00": { plan: "Lunch Break", tag: 'rest', target: '1h' },
                "14:00": { plan: "Secondary Work Block", tag: 'work', target: '3h focus' },
                "15:00": { plan: "Secondary Work Block", tag: 'work', target: '3h focus' },
                "16:00": { plan: "Secondary Work Block", tag: 'work', target: '3h focus' },
                "17:00": { plan: "Exercise / Fitness", tag: 'fitness', target: 'Gym' },
                "18:00": { plan: "English Learning", tag: 'english', target: '1 lesson' },
                "19:00": { plan: "Personal Projects", tag: 'work', target: 'Coding' },
                "20:00": { plan: "Dinner & Relax", tag: 'rest', target: '' },
                "21:00": { plan: "Wind down", tag: 'rest', target: 'Reading' },
                "22:00": { plan: "Deep Sleep Preparation", tag: 'rest', target: '' },
            };

            const defaults = [
                generateFullDay('Full Day Routine', 'Sun', weekdayOverrides),
                {
                    name: 'Morning Focus',
                    icon: 'Sunrise',
                    blocks: [
                        { startTime: "05:00", endTime: "06:00", plan: "Meditation", tag: 'meditation', target: '' },
                        { startTime: "06:00", endTime: "09:00", plan: "Deep Work", tag: 'work', target: '3h' },
                    ]
                }
            ];
            for (const d of defaults) {
                await this.create(userId, d);
            }
        }
    }
}
