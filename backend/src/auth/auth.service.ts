import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService,
    ) { }

    async register(username: string, pass: string): Promise<User> {
        const hashedPassword = await bcrypt.hash(pass, 10);
        const newUser = new this.userModel({ username, password: hashedPassword });
        return newUser.save();
    }

    async login(username: string, pass: string): Promise<{ access_token: string }> {
        const user = await this.userModel.findOne({ username });
        if (user && await bcrypt.compare(pass, user.password)) {
            const payload = { username: user.username, sub: user._id };
            return {
                access_token: this.jwtService.sign(payload),
            };
        }
        throw new UnauthorizedException('Invalid credentials');
    }
}
