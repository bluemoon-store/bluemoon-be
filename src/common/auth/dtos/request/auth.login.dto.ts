import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsNotEmpty,
    IsString,
    Matches,
    IsOptional,
    Length,
} from 'class-validator';

export class UserLoginDto {
    @ApiProperty({
        example: 'nguyen@echodzns.com',
        required: true,
    })
    @IsEmail()
    @IsNotEmpty()
    public email: string;

    @ApiProperty({
        example: '6td6lPRZVC@@!827',
        required: true,
    })
    @IsString()
    @IsNotEmpty()
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
        {
            message:
                'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character',
        }
    )
    public password: string;

    @ApiProperty({
        example: faker.string.numeric(6),
        description: '6-digit TOTP code (required if 2FA is enabled)',
        required: false,
    })
    @IsString()
    @IsOptional()
    @Length(6, 6)
    public twoFactorCode?: string;
}
