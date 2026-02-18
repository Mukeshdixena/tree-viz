import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { TaskService } from './task.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppGateway } from '../gateway/app.gateway';

@Controller('task')
@UseGuards(JwtAuthGuard)
export class TaskController {
    constructor(
        private readonly taskService: TaskService,
        private readonly gateway: AppGateway
    ) { }

    @Get()
    findAll(@Request() req) {
        return this.taskService.findAll(req.user.userId);
    }

    @Post()
    async create(@Request() req, @Body() body) {
        const result = await this.taskService.create(req.user.userId, body);
        this.gateway.server.emit('dataUpdated', { type: 'task', action: 'create', userId: req.user.userId });
        return result;
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id, @Body() body) {
        const result = await this.taskService.update(id, req.user.userId, body);
        this.gateway.server.emit('dataUpdated', { type: 'task', action: 'update', userId: req.user.userId });
        return result;
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id) {
        const result = await this.taskService.remove(id, req.user.userId);
        this.gateway.server.emit('dataUpdated', { type: 'task', action: 'delete', userId: req.user.userId });
        return result;
    }
}
