import { PartialType } from '@nestjs/swagger';

import { CouponCreateDto } from './coupon.create.request';

export class CouponUpdateDto extends PartialType(CouponCreateDto) {}
