import { faker } from '@faker-js/faker';
import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwoFactorSetupResponseDto {
    @ApiProperty({
        example: 'JBSWY3DPEHPK3PXP',
        description: 'Secret key for TOTP (to be stored securely)',
    })
    @IsString()
    public secret: string;

    @ApiProperty({
        example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...',
        description: 'QR code data URL for easy setup',
    })
    @IsString()
    public qrCode: string;

    @ApiProperty({
        example:
            'otpauth://totp/Bluemoon:user@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Bluemoon',
        description: 'TOTP URI for manual entry',
    })
    @IsString()
    public otpAuthUrl: string;
}

export class TwoFactorVerifyResponseDto {
    @ApiProperty({
        example: true,
        description: 'Whether 2FA was successfully enabled',
    })
    public success: boolean;

    @ApiProperty({
        example: 'auth.success.twoFactorEnabled',
    })
    public message: string;
}
