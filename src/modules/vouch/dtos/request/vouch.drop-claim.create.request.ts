import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class VouchDropClaimCreateDto {
    @ApiProperty({
        description: 'Drop claim ID',
        example: 'd7f19aa4-11f2-4f47-b4ce-c9b6f11f1201',
    })
    @IsUUID()
    dropClaimId: string;

    @ApiPropertyOptional({
        description: 'Optional vouch caption',
        maxLength: 500,
        nullable: true,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    caption?: string;
}
