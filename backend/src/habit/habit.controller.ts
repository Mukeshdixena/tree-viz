import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { HabitService } from './habit.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('habits')
@UseGuards(JwtAuthGuard)
export class HabitController {
    constructor(private readonly habitService: HabitService) { }

    @Get()
    async getHabits(@Request() req) {
        return this.habitService.findAll(req.user.userId);
    }

    @Post()
    async createHabit(@Request() req, @Body() body: any) {
        return this.habitService.create(req.user.userId, body);
    }

    @Put(':id')
    async updateHabit(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.habitService.update(req.user.userId, id, body);
    }

    @Delete(':id')
    async deleteHabit(@Request() req, @Param('id') id: string) {
        return this.habitService.delete(req.user.userId, id);
    }

    @Post(':id/toggle')
    async toggleHabit(@Request() req, @Param('id') id: string, @Body('date') date: string) {
        return this.habitService.toggleLog(req.user.userId, id, date);
    }

    @Post(':id/progress')
    async logProgress(@Request() req, @Param('id') id: string, @Body('date') date: string, @Body('value') value: number) {
        return this.habitService.logProgress(req.user.userId, id, date, value);
    }

    @Post(':id/set-progress')
    async setProgress(@Request() req, @Param('id') id: string, @Body('date') date: string, @Body('value') value: number) {
        return this.habitService.setProgress(req.user.userId, id, date, value);
    }
}
