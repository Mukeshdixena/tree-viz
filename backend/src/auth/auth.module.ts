import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from './schemas/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
        JwtModule.register({
            secret: 'SECRET_KEY_123', // In production, use env variable
            signOptions: { expiresIn: '1h' },
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule { }
