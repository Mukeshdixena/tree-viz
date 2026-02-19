import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { GoalService } from './goal.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('goals')
@UseGuards(JwtAuthGuard)
export class GoalController {
    constructor(private readonly goalService: GoalService) { }

    @Get()
    async getGoals(@Request() req) {
        return this.goalService.findAll(req.user.userId);
    }

    @Post()
    async createGoal(@Request() req, @Body() body: any) {
        return this.goalService.create(req.user.userId, body);
    }

    @Put(':id')
    async updateGoal(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.goalService.update(req.user.userId, id, body);
    }

    @Delete(':id')
    async deleteGoal(@Request() req, @Param('id') id: string) {
        return this.goalService.delete(req.user.userId, id);
    }

    // Log incremental progress (e.g., +5 questions solved today)
    @Post(':id/log')
    async logProgress(@Request() req, @Param('id') id: string, @Body('amount') amount: number) {
        return this.goalService.logProgress(req.user.userId, id, amount);
    }

    // Set absolute progress value
    @Post(':id/set')
    async setProgress(@Request() req, @Param('id') id: string, @Body('value') value: number) {
        return this.goalService.setProgress(req.user.userId, id, value);
    }
}
