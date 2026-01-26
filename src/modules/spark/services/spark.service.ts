import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { SparkTransactionType } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import {
    SparkBalanceResponseDto,
    SparkTransactionDto,
} from '../dtos/response/spark-balance.response';
import { ISparkService } from '../interfaces/spark.service.interface';

@Injectable()
export class SparkService implements ISparkService {
    constructor(private readonly databaseService: DatabaseService) {}

    async earnSparks(
        userId: string,
        amount: number,
        reason: string,
        referenceId?: string
    ): Promise<void> {
        try {
            await this.databaseService.$transaction(async tx => {
                // Update user balance
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        sparks: {
                            increment: amount,
                        },
                    },
                });

                // Record transaction
                await tx.sparkTransaction.create({
                    data: {
                        userId,
                        type: this.getTransactionType(reason),
                        amount,
                        reason,
                        referenceId,
                    },
                });
            });
        } catch (_error) {
            throw new HttpException(
                'spark.error.failedToEarn',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async spendSparks(
        userId: string,
        amount: number,
        reason: string,
        referenceId?: string
    ): Promise<void> {
        try {
            // Check if user has enough sparks
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { sparks: true },
            });

            if (!user || user.sparks < amount) {
                throw new HttpException(
                    'spark.error.insufficient',
                    HttpStatus.BAD_REQUEST
                );
            }

            await this.databaseService.$transaction(async tx => {
                // Update user balance
                await tx.user.update({
                    where: { id: userId },
                    data: {
                        sparks: {
                            decrement: amount,
                        },
                    },
                });

                // Record transaction
                await tx.sparkTransaction.create({
                    data: {
                        userId,
                        type: this.getTransactionType(reason),
                        amount: -amount,
                        reason,
                        referenceId,
                    },
                });
            });
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'spark.error.failedToSpend',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getSparkBalance(userId: string): Promise<SparkBalanceResponseDto> {
        try {
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
                select: { sparks: true },
            });

            if (!user) {
                throw new HttpException(
                    'spark.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            const transactions =
                await this.databaseService.sparkTransaction.findMany({
                    where: { userId },
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                });

            const totalEarned =
                await this.databaseService.sparkTransaction.aggregate({
                    where: { userId, amount: { gt: 0 } },
                    _sum: { amount: true },
                });

            const totalSpent =
                await this.databaseService.sparkTransaction.aggregate({
                    where: { userId, amount: { lt: 0 } },
                    _sum: { amount: true },
                });

            return {
                currentBalance: user.sparks,
                totalEarned: totalEarned._sum.amount || 0,
                totalSpent: Math.abs(totalSpent._sum.amount || 0),
                recentTransactions: transactions.map(this.mapTransactionToDto),
            };
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'spark.error.failedToGetBalance',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private getTransactionType(reason: string): SparkTransactionType {
        const lowerReason = reason.toLowerCase();
        if (lowerReason.includes('referral'))
            return SparkTransactionType.REFERRAL_BONUS;
        if (lowerReason.includes('daily'))
            return SparkTransactionType.DAILY_RETURN;
        if (lowerReason.includes('purchase'))
            return SparkTransactionType.PURCHASE;
        return SparkTransactionType.DEEP_MAP_UNLOCK;
    }

    private mapTransactionToDto(transaction: any): SparkTransactionDto {
        return {
            id: transaction.id,
            type: transaction.type,
            amount: transaction.amount,
            reason: transaction.reason,
            referenceId: transaction.referenceId,
            createdAt: transaction.createdAt,
        };
    }
}
