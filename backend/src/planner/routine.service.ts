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
            const defaults = [
                {
                    name: 'Weekday',
                    icon: 'Sun',
                    blocks: [
                        { startTime: "07:00", endTime: "08:00", plan: "Morning Routine", tag: 'rest', target: '1h' },
                        { startTime: "08:00", endTime: "09:00", plan: "DSA Practice", tag: 'dsa', target: '5 problems' },
                        { startTime: "09:00", endTime: "13:00", plan: "Primary Work Block", tag: 'work', target: '4h focus' },
                        { startTime: "13:00", endTime: "14:00", plan: "Lunch Break", tag: 'rest', target: '1h' },
                        { startTime: "14:00", endTime: "17:00", plan: "Secondary Work Block", tag: 'work', target: 'Deep work' },
                        { startTime: "17:00", endTime: "18:00", plan: "Exercise / Fitness", tag: 'fitness', target: 'Gym / Run' },
                        { startTime: "18:00", endTime: "22:00", plan: "English Learning", tag: 'english', target: '1 lesson' },
                    ]
                },
                {
                    name: 'Weekend',
                    icon: 'Moon',
                    blocks: [
                        { startTime: "09:00", endTime: "10:00", plan: "Meditation & Coffee", tag: 'meditation', target: '20 min' },
                        { startTime: "10:00", endTime: "13:00", plan: "Hobbies / Errands", tag: 'none', target: '' },
                        { startTime: "13:00", endTime: "15:00", plan: "Family Lunch", tag: 'family', target: 'Quality time' },
                        { startTime: "15:00", endTime: "18:00", plan: "Relaxation / Outing", tag: 'rest', target: 'Beach / Park' },
                        { startTime: "18:00", endTime: "22:00", plan: "Evening Leisure", tag: 'rest', target: 'Movie / Book' },
                    ]
                }
            ];
            for (const d of defaults) {
                await this.create(userId, d);
            }
        }
    }
}
