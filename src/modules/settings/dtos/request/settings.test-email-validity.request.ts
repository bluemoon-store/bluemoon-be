import { ApiProperty } from '@nestjs/swagger';
import { IsUrl } from 'class-validator';

export class SettingsTestEmailValidityRequestDto {
    @ApiProperty()
    @IsUrl({ protocols: ['https'], require_protocol: true })
    url: string;
}
