import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { StatsService } from './stats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
    constructor(private readonly statsService: StatsService) { }

    @Get('dashboard')
    async getDashboard(@Request() req) {
        return this.statsService.getDashboardStats(req.user.userId);
    }

    @Get('discipline')
    async getDiscipline(@Request() req) {
        return this.statsService.getDisciplineScore(req.user.userId);
    }
}

