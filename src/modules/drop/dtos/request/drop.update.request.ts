import { PartialType } from '@nestjs/swagger';

import { DropCreateDto } from './drop.create.request';

export class DropUpdateDto extends PartialType(DropCreateDto) {}
