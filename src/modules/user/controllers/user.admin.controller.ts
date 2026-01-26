import { Controller, Delete, HttpStatus, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

import { DocGenericResponse } from 'src/common/doc/decorators/doc.generic.decorator';
import { AllowedRoles } from 'src/common/request/decorators/request.role.decorator';
import { AuthUser } from 'src/common/request/decorators/request.user.decorator';
import { IAuthUser } from 'src/common/request/interfaces/request.interface';
import { ApiGenericResponseDto } from 'src/common/response/dtos/response.generic.dto';

import { UserService } from '../services/user.service';

@ApiTags('admin.user')
@Controller({
    path: '/admin/user',
    version: '1',
})
export class UserAdminController {
    constructor(private readonly userService: UserService) {}

    @Delete(':id')
    @AllowedRoles([Role.ADMIN])
    @ApiBearerAuth('accessToken')
    @ApiOperation({ summary: 'Delete user' })
    @DocGenericResponse({
        httpStatus: HttpStatus.OK,
        messageKey: 'user.success.deleted',
    })
    public async deleteUser(
        @Param('id') userId: string,
        @AuthUser() user: IAuthUser
    ): Promise<ApiGenericResponseDto> {
        return this.userService.deleteUser(userId, user.userId, user.role);
    }
}
