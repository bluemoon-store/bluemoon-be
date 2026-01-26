import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsDateString,
    IsNotEmpty,
} from 'class-validator';
import { EnergyMapFocus } from '@prisma/client';

export class CreateEnergyMapDto {
    @ApiProperty({
        enum: EnergyMapFocus,
        enumName: 'EnergyMapFocus',
        example: EnergyMapFocus.INNER_NATURE,
        description: 'The focus area for the energy map analysis',
    })
    @IsEnum(EnergyMapFocus)
    focus: EnergyMapFocus;

    @ApiProperty({
        example: 'John Doe',
        description:
            'Your name or an alias (optional, for privacy). If not provided, will use your account name.',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({
        example: '1990-05-15',
        description:
            'Your date of birth in ISO format (YYYY-MM-DD). Used for pattern analysis.',
        format: 'date',
    })
    @IsDateString()
    dateOfBirth: string;

    @ApiPropertyOptional({
        example: 'energy-maps/palms/user-123/left-palm-abc123.jpg',
        description:
            'S3 key for the left palm image. If provided along with right palm and face images, will process deep analysis (costs 10 sparks). Reveals inborn tendencies.',
    })
    @IsOptional()
    @IsString()
    leftPalmImageKey?: string;

    @ApiPropertyOptional({
        example: 'energy-maps/palms/user-123/right-palm-abc123.jpg',
        description:
            'S3 key for the right palm image. If provided along with left palm and face images, will process deep analysis (costs 10 sparks). Reveals learned behavior.',
    })
    @IsOptional()
    @IsString()
    rightPalmImageKey?: string;

    @ApiPropertyOptional({
        example: 'energy-maps/faces/user-123/face-abc123.jpg',
        description:
            'S3 key for the facial structure image. If provided along with palm images, will process deep analysis (costs 10 sparks). Reveals expression patterns.',
    })
    @IsOptional()
    @IsString()
    faceImageKey?: string;
}
