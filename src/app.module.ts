import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { ApplicationsModule } from './applications/applications.module';
import { TransactionsModule } from './transactions/transactions.module';
import { ShowcasesModule } from './showcases/showcases.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // WAJIB ada agar process.env/ConfigService terbaca di seluruh Strategy
    }),
    AuthModule,
    PrismaModule,
    ProjectsModule,
    ApplicationsModule,
    TransactionsModule,
    ShowcasesModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
