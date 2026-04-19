import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { Observable, map } from 'rxjs';

import {
    DOC_RESPONSE_MESSAGE_META_KEY,
    DOC_RESPONSE_PAGINATED_META_KEY,
    DOC_RESPONSE_SERIALIZATION_META_KEY,
} from 'src/common/doc/constants/doc.constant';
import { ApiPaginationMetadataDto } from '../dtos/response.paginated.dto';
import { MessageService } from 'src/common/message/services/message.service';

import { ApiGenericResponseDto } from '../dtos/response.generic.dto';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
    constructor(
        private readonly reflector: Reflector,
        private readonly messageService: MessageService
    ) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        return next.handle().pipe(
            map(responseBody => {
                const ctx = context.switchToHttp();
                const response = ctx.getResponse();
                const statusCode: number = response.statusCode;

                const classSerialization: ClassConstructor<any> =
                    this.reflector.get(
                        DOC_RESPONSE_SERIALIZATION_META_KEY,
                        context.getHandler()
                    );

                const isPaginatedResponse =
                    this.reflector.get<boolean>(
                        DOC_RESPONSE_PAGINATED_META_KEY,
                        context.getHandler()
                    ) === true;

                const messageKey = this.reflector.get(
                    DOC_RESPONSE_MESSAGE_META_KEY,
                    context.getHandler()
                );

                const data = classSerialization
                    ? isPaginatedResponse &&
                      responseBody &&
                      typeof responseBody === 'object' &&
                      Array.isArray(
                          (responseBody as { items?: unknown }).items
                      ) &&
                      (responseBody as { metadata?: unknown }).metadata !==
                          undefined &&
                      typeof (responseBody as { metadata?: unknown })
                          .metadata === 'object'
                        ? {
                              items: (
                                  responseBody as { items: unknown[] }
                              ).items.map(item =>
                                  plainToInstance(classSerialization, item, {
                                      excludeExtraneousValues: true,
                                  })
                              ),
                              metadata: plainToInstance(
                                  ApiPaginationMetadataDto,
                                  (responseBody as { metadata: unknown })
                                      .metadata,
                                  { excludeExtraneousValues: true }
                              ),
                          }
                        : plainToInstance(classSerialization, responseBody, {
                              excludeExtraneousValues: true,
                          })
                    : responseBody;

                // Translate response message
                let message: string;
                if (messageKey) {
                    message = this.messageService.translate(messageKey);
                } else {
                    // Use HTTP success message based on status code
                    message = this.messageService.translateKey(
                        ['http', 'success', statusCode],
                        {
                            defaultValue: 'Success',
                        }
                    );
                }

                // Handle ApiGenericResponseDto message translation
                if (
                    data &&
                    typeof data === 'object' &&
                    'message' in data &&
                    classSerialization?.name === ApiGenericResponseDto.name
                ) {
                    data.message = this.messageService.translate(data.message, {
                        defaultValue: data.message,
                    });
                }

                return {
                    statusCode,
                    message,
                    timestamp: new Date().toISOString(),
                    data,
                };
            })
        );
    }
}
