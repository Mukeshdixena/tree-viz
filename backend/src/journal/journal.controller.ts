import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { JournalService } from './journal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppGateway } from '../gateway/app.gateway';

@Controller('journal')
@UseGuards(JwtAuthGuard)
export class JournalController {
    constructor(
        private readonly journalService: JournalService,
        private readonly gateway: AppGateway
    ) { }

    @Get()
    findAll(@Request() req) {
        return this.journalService.findAll(req.user.userId);
    }

    @Post()
    async create(@Request() req, @Body() body) {
        const result = await this.journalService.create(req.user.userId, body);
        this.gateway.server.emit('dataUpdated', { type: 'journal', action: 'create', userId: req.user.userId });
        return result;
    }

    @Put(':id')
    async update(@Request() req, @Param('id') id, @Body() body) {
        const result = await this.journalService.update(id, req.user.userId, body);
        this.gateway.server.emit('dataUpdated', { type: 'journal', action: 'update', userId: req.user.userId });
        return result;
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id) {
        const result = await this.journalService.remove(id, req.user.userId);
        this.gateway.server.emit('dataUpdated', { type: 'journal', action: 'delete', userId: req.user.userId });
        return result;
    }
}
