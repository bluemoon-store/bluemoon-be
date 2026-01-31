import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

/**
 * Query parameter transformation options
 */
export interface QueryTransformOptions {
    /**
     * Fields that should be parsed as numbers
     * @default ['page', 'limit']
     */
    numberFields?: string[];

    /**
     * Fields that should be parsed as booleans
     * @default ['isActive', 'isFeatured']
     */
    booleanFields?: string[];

    /**
     * Whether to remove undefined values from the result
     * @default true
     */
    removeUndefined?: boolean;
}

/**
 * Transforms query parameters to their proper types
 *
 * Automatically converts:
 * - Number fields (page, limit) from string to number
 * - Boolean fields (isActive, isFeatured) from string to boolean
 * - Handles undefined values appropriately
 *
 * @example
 * // In controller:
 * @Get()
 * async list(@Query(QueryTransformPipe) query: any) {
 *   // query.page and query.limit are numbers
 *   // query.isActive and query.isFeatured are booleans
 * }
 *
 * @example
 * // With custom options:
 * @Get()
 * async list(@Query(new QueryTransformPipe({
 *   numberFields: ['page', 'limit', 'offset'],
 *   booleanFields: ['isActive', 'isFeatured', 'isDeleted']
 * })) query: any) {
 *   // Custom transformation
 * }
 */
@Injectable()
export class QueryTransformPipe implements PipeTransform {
    private readonly defaultNumberFields = ['page', 'limit'];
    private readonly defaultBooleanFields = ['isActive', 'isFeatured'];
    private readonly options: Required<QueryTransformOptions>;

    constructor(options?: QueryTransformOptions) {
        this.options = {
            numberFields: options?.numberFields ?? this.defaultNumberFields,
            booleanFields: options?.booleanFields ?? this.defaultBooleanFields,
            removeUndefined: options?.removeUndefined ?? true,
        };
    }

    transform(value: any, _metadata: ArgumentMetadata): any {
        if (!value || typeof value !== 'object') {
            return value;
        }

        const transformed: any = {};

        for (const [key, val] of Object.entries(value)) {
            // Skip undefined values if removeUndefined is true
            if (val === undefined && this.options.removeUndefined) {
                continue;
            }

            // Transform number fields
            if (this.options.numberFields.includes(key)) {
                transformed[key] = this.parseNumber(val);
                continue;
            }

            // Transform boolean fields
            if (this.options.booleanFields.includes(key)) {
                transformed[key] = this.parseBoolean(val);
                continue;
            }

            // Keep other fields as-is
            transformed[key] = val;
        }

        return transformed;
    }

    /**
     * Parse a value to a number, returning undefined if invalid
     */
    private parseNumber(value: any): number | undefined {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        const num = Number(value);
        return isNaN(num) ? undefined : num;
    }

    /**
     * Parse a value to a boolean, returning undefined if not a valid boolean string
     */
    private parseBoolean(value: any): boolean | undefined {
        if (value === undefined || value === null || value === '') {
            return undefined;
        }

        // If already a boolean, return as-is
        if (typeof value === 'boolean') {
            return value;
        }

        // Convert string to boolean
        const str = String(value).toLowerCase();
        if (str === 'true' || str === '1') {
            return true;
        }
        if (str === 'false' || str === '0') {
            return false;
        }

        // Invalid boolean string, return undefined
        return undefined;
    }
}
