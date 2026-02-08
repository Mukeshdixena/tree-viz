import { Controller, Post, Body, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body.username, body.password);
    }

    @Post('login')
    async login(@Body() body: any) {
        return this.authService.login(body.username, body.password);
    }

    @Get('hello')
    getHello() {
        return { message: 'Hello World from Auth Module!' };
    }
}
