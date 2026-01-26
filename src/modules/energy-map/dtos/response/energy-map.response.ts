import { faker } from '@faker-js/faker';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EnergyMapFocus, EnergyMapStatus } from '@prisma/client';
import { Expose, Type } from 'class-transformer';
import {
    IsArray,
    IsDate,
    IsEnum,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
} from 'class-validator';

export class EnergyMapResponseDto {
    @ApiProperty({
        example: faker.string.uuid(),
        description: 'Unique identifier for the energy map',
    })
    @Expose()
    @IsUUID()
    id: string;

    @ApiProperty({
        enum: EnergyMapFocus,
        example: EnergyMapFocus.INNER_NATURE,
        description: 'The focus area for the energy map analysis',
    })
    @Expose()
    @IsEnum(EnergyMapFocus)
    focus: EnergyMapFocus;

    @ApiProperty({
        enum: EnergyMapStatus,
        example: EnergyMapStatus.COMPLETED,
        description: 'Current status of the energy map processing',
    })
    @Expose()
    @IsEnum(EnergyMapStatus)
    status: EnergyMapStatus;

    @ApiPropertyOptional({
        example: 'John Doe',
        description: 'Name or alias used for the energy map',
    })
    @Expose()
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        example: faker.date.birthdate().toISOString(),
        description: 'Date of birth used for analysis',
    })
    @Expose()
    @IsDate()
    @Type(() => Date)
    dateOfBirth: Date;

    // Simple Map Results
    @ApiPropertyOptional({
        example: [
            'The Visionary Catalyst - You possess a unique ability to see possibilities others miss',
            'Your energy signature shows strong intuitive patterns',
        ],
        description: 'Core patterns identified from the analysis',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    corePattern?: string[];

    @ApiProperty({
        example: ['Natural leadership abilities', 'Strong intuitive insights'],
        description: 'List of identified strengths',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    strengths: string[];

    @ApiProperty({
        example: [
            'Tendency to overthink decisions',
            'Difficulty with routine tasks',
        ],
        description: 'List of identified challenges',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    challenges: string[];

    @ApiProperty({
        example: [
            'Entrepreneurship and innovation',
            'Creative and artistic fields',
        ],
        description: 'Career tendencies identified from the analysis',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    careerTendencies: string[];

    @ApiProperty({
        example: [
            'Seeks deep, meaningful connections',
            'Values intellectual compatibility',
        ],
        description: 'Relationship patterns identified from the analysis',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    relationshipPatterns: string[];

    // Deep Map Results (only if unlocked)
    @ApiPropertyOptional({
        example: [
            'Your left palm reveals strong intuitive lines indicating natural wisdom',
            'The combination suggests a person who transforms inner knowing into external influence',
        ],
        description: 'Explanation of why patterns repeat (Deep Map only)',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    patternExplanation?: string[];

    @ApiPropertyOptional({
        example: [
            'Major life transitions typically occur every 7-9 years',
            'The next significant shift likely around age 28-30',
            'Your energy peaks during spring and autumn seasons',
        ],
        description: 'Timing insights for pattern activation (Deep Map only)',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    timingInsights?: string[];

    @ApiPropertyOptional({
        example: [
            'Your current phase focuses on building foundational skills',
            'The next evolution involves stepping into leadership roles',
            'Sharing your unique perspective with larger audiences',
        ],
        description: 'Evolution path insights (Deep Map only)',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    evolutionPath?: string[];

    @ApiPropertyOptional({
        example: ['Practice daily meditation', 'Set structured routines'],
        description:
            'Adjustment strategies for personal growth (Deep Map only)',
        type: [String],
    })
    @Expose()
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    adjustmentStrategies?: string[];

    // Metadata
    @ApiProperty({
        example: 0,
        description: 'Number of sparks used for this energy map',
    })
    @Expose()
    @IsNumber()
    sparksUsed: number;

    @ApiProperty({
        example: faker.date.past().toISOString(),
        description: 'When the energy map was created',
    })
    @Expose()
    @IsDate()
    @Type(() => Date)
    createdAt: Date;

    @ApiProperty({
        example: faker.date.recent().toISOString(),
        description: 'When the energy map was last updated',
    })
    @Expose()
    @IsDate()
    @Type(() => Date)
    updatedAt: Date;

    @ApiPropertyOptional({
        example: null,
        description: 'When the energy map was deleted (if applicable)',
    })
    @Expose()
    @IsDate()
    @Type(() => Date)
    @IsOptional()
    deletedAt?: Date;
}
