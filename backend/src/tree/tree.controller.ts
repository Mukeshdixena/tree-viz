import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { TreeService } from './tree.service';

@Controller('trees')
export class TreeController {
    constructor(private readonly treeService: TreeService) { }

    @Get()
    async findAll() {
        return this.treeService.findAll();
    }

    @Post()
    async create(@Body() treeData: any) {
        return this.treeService.create(treeData);
    }

    @Post('sync')
    async syncAll(@Body() trees: any[]) {
        return this.treeService.updateAll(trees);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() treeData: any) {
        return this.treeService.update(id, treeData);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.treeService.delete(id);
    }
}
