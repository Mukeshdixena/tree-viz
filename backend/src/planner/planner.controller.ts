import { Controller, Get, Post, Put, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PlannerService } from './planner.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppGateway } from '../gateway/app.gateway';

@Controller('planner')
@UseGuards(JwtAuthGuard)
export class PlannerController {
    constructor(
        private readonly plannerService: PlannerService,
        private readonly gateway: AppGateway
    ) { }

    @Get()
    async getPlanner(@Request() req, @Query('date') date: string) {
        const targetDate = date || new Date().toISOString().split('T')[0];
        return this.plannerService.findByDate(req.user.userId, targetDate);
    }

    @Get('month')
    async getMonthSummary(@Request() req, @Query('year') year: string, @Query('month') month: string) {
        return this.plannerService.findMonthSummary(req.user.userId, parseInt(year), parseInt(month));
    }

    @Put()
    async updatePlanner(@Request() req, @Body() body: any) {
        const result = await this.plannerService.update(req.user.userId, body.date, body);
        this.gateway.server.emit('dataUpdated', { type: 'planner', action: 'update', userId: req.user.userId });
        return result;
    }
}
