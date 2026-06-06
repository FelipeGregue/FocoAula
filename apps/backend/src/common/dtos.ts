import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { eventTypes, priorities, recurrences, taskStatuses } from './domain.types';
import type { EventType, Priority, Recurrence, TaskStatus } from './domain.types';

export class RegisterDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}

export class LoginDto {
  @IsEmail()
  email!: string;

  @IsString()
  password!: string;
}

export class SubjectDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  teacher?: string;

  @IsString()
  color!: string;
}

export class TaskDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsISO8601()
  dueDate!: string;

  @IsIn(priorities)
  priority!: Priority;

  @IsIn(taskStatuses)
  status!: TaskStatus;

  @IsIn(recurrences)
  recurrence!: Recurrence;

  @IsNumber()
  @Min(0)
  @Max(10080)
  reminderMinutesBefore!: number;
}

export class EventDto {
  @IsString()
  title!: string;

  @IsIn(eventTypes)
  type!: EventType;

  @IsOptional()
  @IsString()
  subjectId?: string;

  @IsISO8601()
  startsAt!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsNumber()
  @Min(0)
  @Max(10080)
  reminderMinutesBefore!: number;
}

export class GradeDto {
  @IsString()
  subjectId!: string;

  @IsString()
  title!: string;

  @IsNumber()
  @Min(0)
  @Max(10)
  score!: number;

  @IsNumber()
  @Min(0.1)
  @Max(10)
  weight!: number;

  @IsISO8601()
  date!: string;
}

export class ReminderDto {
  @IsBoolean()
  enabled!: boolean;

  @IsNumber()
  @Min(0)
  @Max(10080)
  defaultMinutesBefore!: number;

  @IsString()
  quietHoursStart!: string;

  @IsString()
  quietHoursEnd!: string;
}
