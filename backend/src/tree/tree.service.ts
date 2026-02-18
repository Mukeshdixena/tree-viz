import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Tree } from './schemas/tree.schema';

@Injectable()
export class TreeService {
    constructor(@InjectModel(Tree.name) private treeModel: Model<Tree>) { }

    async findAll(userId: string): Promise<Tree[]> {
        return this.treeModel.find({ userId: new Types.ObjectId(userId) }).exec();
    }

    async findOne(id: string, userId: string): Promise<Tree> {
        return this.treeModel.findOne({ _id: new Types.ObjectId(id), userId: new Types.ObjectId(userId) }).exec();
    }

    async create(userId: string, treeData: any): Promise<Tree> {
        const createdTree = new this.treeModel({ ...treeData, userId });
        return createdTree.save();
    }

    async update(id: string, userId: string, treeData: any): Promise<Tree> {
        return this.treeModel.findOneAndUpdate({ _id: id, userId }, treeData, { new: true }).exec();
    }

    async delete(id: string, userId: string): Promise<any> {
        return this.treeModel.deleteOne({ _id: id, userId }).exec();
    }

    async updateAll(userId: string, trees: any[]): Promise<any> {
        // Clear user's trees and re-insert
        await this.treeModel.deleteMany({ userId });
        const treesWithUserId = trees.map(t => {
            const { _id, ...rest } = t; // Remove existing ID to avoid conflicts if they were from local storage
            return { ...rest, userId };
        });
        return this.treeModel.insertMany(treesWithUserId);
    }
}
