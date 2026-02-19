import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { RoutineService } from './routine.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('routines')
@UseGuards(JwtAuthGuard)
export class RoutineController {
    constructor(private readonly routineService: RoutineService) { }

    @Get()
    async getRoutines(@Request() req) {
        await this.routineService.seedDefaults(req.user.userId);
        return this.routineService.findAll(req.user.userId);
    }

    @Post()
    async createRoutine(@Request() req, @Body() body: any) {
        return this.routineService.create(req.user.userId, body);
    }

    @Put(':id')
    async updateRoutine(@Request() req, @Param('id') id: string, @Body() body: any) {
        return this.routineService.update(req.user.userId, id, body);
    }

    @Delete(':id')
    async deleteRoutine(@Request() req, @Param('id') id: string) {
        return this.routineService.delete(req.user.userId, id);
    }
}
