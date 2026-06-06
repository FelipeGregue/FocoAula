import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { EventsModule } from './events/events.module';
import { GradesModule } from './grades/grades.module';
import { RemindersModule } from './reminders/reminders.module';
import { SubjectsModule } from './subjects/subjects.module';
import { TasksModule } from './tasks/tasks.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    DashboardModule,
    SubjectsModule,
    TasksModule,
    EventsModule,
    GradesModule,
    RemindersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
