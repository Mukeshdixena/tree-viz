import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TreeService } from './tree.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppGateway } from '../gateway/app.gateway';

@Controller('trees')
@UseGuards(JwtAuthGuard)
export class TreeController {
    constructor(
        private readonly treeService: TreeService,
        private readonly gateway: AppGateway
    ) { }

    @Get()
    async findAll(@Request() req) {
        return this.treeService.findAll(req.user.userId);
    }

    @Post()
    async create(@Request() req, @Body() treeData: any) {
        const result = await this.treeService.create(req.user.userId, treeData);
        this.gateway.server.emit('dataUpdated', { type: 'tree', action: 'create', userId: req.user.userId });
        return result;
    }

    @Post('sync')
    async syncAll(@Request() req, @Body() trees: any[]) {
        const result = await this.treeService.updateAll(req.user.userId, trees);
        this.gateway.server.emit('dataUpdated', { type: 'tree', action: 'sync', userId: req.user.userId });
        return result;
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id: string, @Body() treeData: any) {
        const result = await this.treeService.update(id, req.user.userId, treeData);
        this.gateway.server.emit('dataUpdated', { type: 'tree', action: 'update', userId: req.user.userId });
        return result;
    }

    @Delete(':id')
    async delete(@Request() req, @Param('id') id: string) {
        const result = await this.treeService.delete(id, req.user.userId);
        this.gateway.server.emit('dataUpdated', { type: 'tree', action: 'delete', userId: req.user.userId });
        return result;
    }
}
