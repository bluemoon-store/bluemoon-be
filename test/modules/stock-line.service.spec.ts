import { HttpException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { StockLineStatus } from '@prisma/client';
import { PinoLogger } from 'nestjs-pino';

import { DatabaseService } from 'src/common/database/services/database.service';
import { StockLineService } from 'src/modules/stock-line/services/stock-line.service';
import { ConfigService } from '@nestjs/config';

describe('StockLineService', () => {
    let service: StockLineService;

    const mockLogger = {
        setContext: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
    };

    const mockConfig = {
        get: jest.fn().mockImplementation((_k: string, def: unknown) => def),
    };

    const createMockTx = () => ({
        $executeRawUnsafe: jest.fn().mockResolvedValue(undefined),
        productVariant: {
            findFirst: jest.fn().mockResolvedValue({ id: 'v1' }),
            findUniqueOrThrow: jest.fn().mockResolvedValue({
                id: 'v1',
                stockQuantity: 2,
            }),
            update: jest.fn().mockResolvedValue({}),
        },
        productStockLine: {
            createMany: jest.fn(),
            count: jest.fn(),
            findMany: jest.fn(),
            updateMany: jest.fn(),
            delete: jest.fn(),
            deleteMany: jest.fn(),
        },
        orderItem: {
            findMany: jest.fn().mockResolvedValue([{ id: 'oi1' }]),
        },
    });

    const mockDatabaseService = {
        $transaction: jest.fn(),
        productVariant: { findFirst: jest.fn() },
        productStockLine: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    };

    beforeEach(async () => {
        jest.clearAllMocks();
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StockLineService,
                { provide: DatabaseService, useValue: mockDatabaseService },
                { provide: ConfigService, useValue: mockConfig },
                { provide: PinoLogger, useValue: mockLogger },
            ],
        }).compile();

        service = module.get(StockLineService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('bulkAddLines', () => {
        it('returns added/skipped for dedupe and syncs counter', async () => {
            const tx = createMockTx();
            (tx.productStockLine.createMany as jest.Mock).mockResolvedValue({
                count: 2,
            });
            (tx.productStockLine.count as jest.Mock).mockImplementation(
                async (args: { where: { status?: StockLineStatus } }) => {
                    const st = args.where.status;
                    if (st === StockLineStatus.AVAILABLE) {
                        return 5;
                    }
                    return 0;
                }
            );

            mockDatabaseService.$transaction.mockImplementation(
                async (fn: (t: unknown) => Promise<unknown>) => fn(tx)
            );

            const result = await service.bulkAddLines('p1', 'v1', [
                'line-a',
                'line-b',
                'line-a',
            ]);

            expect(result.added).toBe(2);
            expect(result.skipped).toBe(1);
            expect(result.totals.available).toBe(5);
            expect(tx.productVariant.update).toHaveBeenCalledWith({
                where: { id: 'v1' },
                data: { stockQuantity: 5 },
            });
        });
    });

    describe('allocateForOrderItem', () => {
        it('throws when fewer AVAILABLE lines than quantity', async () => {
            const tx = createMockTx();
            (tx.productStockLine.count as jest.Mock).mockResolvedValue(2);
            await expect(
                service.allocateForOrderItem(
                    tx as never,
                    'oi1',
                    'v1',
                    3,
                    new Date()
                )
            ).rejects.toThrow(HttpException);
        });

        it('reserves lines and decrements counter when pool is sufficient', async () => {
            const tx = createMockTx();
            (tx.productStockLine.count as jest.Mock).mockResolvedValueOnce(2);
            (tx.productStockLine.findMany as jest.Mock).mockResolvedValue([
                { id: 'l1' },
                { id: 'l2' },
            ]);

            await service.allocateForOrderItem(
                tx as never,
                'oi1',
                'v1',
                2,
                new Date('2030-01-01')
            );

            expect(tx.productStockLine.updateMany).toHaveBeenCalled();
            expect(tx.productVariant.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'v1' },
                    data: { stockQuantity: { decrement: 2 } },
                })
            );
        });
    });

    describe('releaseForOrderItem', () => {
        it('increments variant stock by released RESERVED count', async () => {
            const tx = createMockTx();
            (tx.productStockLine.findMany as jest.Mock).mockResolvedValue([
                { id: 'a', variantId: 'v1' },
                { id: 'b', variantId: 'v1' },
            ]);

            await service.releaseForOrderItem(tx as never, 'oi1');

            expect(tx.productStockLine.updateMany).toHaveBeenCalled();
            expect(tx.productVariant.update).toHaveBeenCalledWith({
                where: { id: 'v1' },
                data: { stockQuantity: { increment: 2 } },
            });
        });
    });

    describe('retireForOrderItem', () => {
        it('marks SOLD lines REFUNDED', async () => {
            const tx = createMockTx();
            await service.retireForOrderItem(tx as never, 'oi1');
            expect(tx.productStockLine.updateMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: {
                        orderItemId: 'oi1',
                        status: StockLineStatus.SOLD,
                    },
                    data: expect.objectContaining({
                        status: StockLineStatus.REFUNDED,
                    }),
                })
            );
        });
    });

    describe('concurrent allocate (serialized)', () => {
        it('second allocation fails when pool has one line', async () => {
            const runAllocate = async () => {
                const tx = createMockTx();
                (tx.productStockLine.count as jest.Mock).mockResolvedValue(1);
                (tx.productStockLine.findMany as jest.Mock).mockResolvedValue([
                    { id: 'l1' },
                ]);
                await service.allocateForOrderItem(
                    tx as never,
                    'oi-a',
                    'v1',
                    1,
                    new Date()
                );
            };

            await runAllocate();

            const tx2 = createMockTx();
            (tx2.productStockLine.count as jest.Mock).mockResolvedValue(0);
            (
                tx2.productVariant.findUniqueOrThrow as jest.Mock
            ).mockResolvedValue({
                id: 'v1',
                stockQuantity: 0,
            });

            await expect(
                service.allocateForOrderItem(
                    tx2 as never,
                    'oi-b',
                    'v1',
                    1,
                    new Date()
                )
            ).rejects.toThrow(HttpException);
        });
    });
});
