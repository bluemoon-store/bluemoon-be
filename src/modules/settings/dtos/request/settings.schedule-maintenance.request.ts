import { ApiProperty } from '@nestjs/swagger';
import { IsISO8601, IsString, Matches } from 'class-validator';

export class SettingsScheduleMaintenanceRequestDto {
    @ApiProperty({
        description: 'ISO date of the maintenance window (YYYY-MM-DD)',
        example: '2026-06-12',
    })
    @IsISO8601({ strict: true })
    date: string;

    @ApiProperty({
        description: 'Maintenance start time in 24-hour HH:mm (UTC)',
        example: '02:00',
    })
    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'settings.error.invalidMaintenanceTime',
    })
    startTime: string;

    @ApiProperty({
        description: 'Maintenance end time in 24-hour HH:mm (UTC)',
        example: '04:30',
    })
    @IsString()
    @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
        message: 'settings.error.invalidMaintenanceTime',
    })
    endTime: string;
}
