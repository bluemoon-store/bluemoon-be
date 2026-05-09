import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsString } from 'class-validator';

import { UserAdminListItemResponseDto } from './user.admin.response';

export class UserAdminCreateResponseDto {
    @ApiProperty({ type: UserAdminListItemResponseDto })
    @Expose()
    @Type(() => UserAdminListItemResponseDto)
    user: UserAdminListItemResponseDto;

    @ApiProperty({
        description:
            'Plaintext password returned only once at creation; it is not stored or retrievable later.',
    })
    @Expose()
    @IsString()
    generatedPassword: string;
}
