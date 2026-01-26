import { SparkBalanceResponseDto } from '../dtos/response/spark-balance.response';

export interface ISparkService {
    earnSparks(
        userId: string,
        amount: number,
        reason: string,
        referenceId?: string
    ): Promise<void>;
    spendSparks(
        userId: string,
        amount: number,
        reason: string,
        referenceId?: string
    ): Promise<void>;
    getSparkBalance(userId: string): Promise<SparkBalanceResponseDto>;
}
