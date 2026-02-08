import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tree } from './schemas/tree.schema';

@Injectable()
export class TreeService {
    constructor(@InjectModel(Tree.name) private treeModel: Model<Tree>) { }

    async findAll(): Promise<Tree[]> {
        return this.treeModel.find().exec();
    }

    async findOne(id: string): Promise<Tree> {
        return this.treeModel.findById(id).exec();
    }

    async create(treeData: any): Promise<Tree> {
        const createdTree = new this.treeModel(treeData);
        return createdTree.save();
    }

    async update(id: string, treeData: any): Promise<Tree> {
        return this.treeModel.findByIdAndUpdate(id, treeData, { new: true }).exec();
    }

    async delete(id: string): Promise<any> {
        return this.treeModel.findByIdAndRemove(id).exec();
    }

    async updateAll(trees: any[]): Promise<any> {
        // For simplicity, we can replace all trees or update them
        // Here we'll just clear and re-insert for the 'sync' feel of the current local state
        await this.treeModel.deleteMany({});
        return this.treeModel.insertMany(trees);
    }
}
