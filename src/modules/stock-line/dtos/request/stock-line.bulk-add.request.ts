import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsString } from 'class-validator';

export class StockLineBulkAddRequestDto {
    @ApiProperty({
        type: [String],
        description: 'Raw stock lines (proxies, credentials, keys)',
        maxItems: 5000,
    })
    @IsArray()
    @ArrayMaxSize(5000)
    @IsString({ each: true })
    lines: string[];
}
