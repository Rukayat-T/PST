import { Module } from '@nestjs/common';
import { AuthController } from './Auth.controller';
import { AuthService } from './Auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserEntity } from '../entities/UserEntity.entity';
import { JwtModule } from '@nestjs/jwt';
import { JwtGuard } from 'src/guards/jwt.guard';
import { JwtStrategy } from 'src/guards/jwt.strategy';
import { TutorProfile } from 'src/entities/TutorProfile.entity';
import { StudentProfile } from 'src/entities/StudentProfile.entity';

@Module({
  imports: [
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '3600s' },
      }),
    }),
    TypeOrmModule.forFeature([UserEntity, TutorProfile, StudentProfile]),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard, JwtStrategy],
  exports: [TypeOrmModule, AuthService],
})
export class AuthModule {}
