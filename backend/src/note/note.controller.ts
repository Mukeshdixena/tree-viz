import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { NoteService } from './note.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('note')
@UseGuards(JwtAuthGuard)
export class NoteController {
    constructor(private readonly noteService: NoteService) { }

    @Get()
    findAll(@Request() req) {
        return this.noteService.findAll(req.user.userId);
    }

    @Post()
    create(@Request() req, @Body() body) {
        return this.noteService.create(req.user.userId, body);
    }

    @Put(':id')
    update(@Request() req, @Param('id') id, @Body() body) {
        return this.noteService.update(id, req.user.userId, body);
    }

    @Delete(':id')
    remove(@Request() req, @Param('id') id) {
        return this.noteService.remove(id, req.user.userId);
    }
}
