import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { EnergyMapStatus } from '@prisma/client';

import { DatabaseService } from 'src/common/database/services/database.service';
import { SparkService } from 'src/modules/spark/services/spark.service';
import { CreateEnergyMapDto } from '../dtos/request/energy-map-create.request';
import { EnergyMapResponseDto } from '../dtos/response/energy-map.response';
import { IEnergyMapService } from '../interfaces/energy-map.service.interface';
import { EnergyMapAnalysisService } from './energy-map-analysis.service';

@Injectable()
export class EnergyMapService implements IEnergyMapService {
    private readonly DEEP_MAP_COST = 10; // Cost in sparks

    constructor(
        private readonly databaseService: DatabaseService,
        private readonly analysisService: EnergyMapAnalysisService,
        private readonly sparkService: SparkService
    ) {}

    async createEnergyMap(
        userId: string,
        createDto: CreateEnergyMapDto
    ): Promise<EnergyMapResponseDto> {
        try {
            // Validate user exists
            const user = await this.databaseService.user.findUnique({
                where: { id: userId },
            });

            if (!user) {
                throw new HttpException(
                    'energy-map.error.userNotFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Check if premium map
            const hasAllImageKeys =
                createDto.leftPalmImageKey ||
                createDto.rightPalmImageKey ||
                createDto.faceImageKey;

            // If premium map, check and deduct sparks
            let sparksUsed = 0;
            if (hasAllImageKeys) {
                if (user.sparks < this.DEEP_MAP_COST) {
                    throw new HttpException(
                        'energy-map.error.insufficientSparksForDeepMap',
                        HttpStatus.BAD_REQUEST
                    );
                }

                // Spend sparks for deep map
                await this.sparkService.spendSparks(
                    userId,
                    this.DEEP_MAP_COST,
                    'Deep map analysis',
                    undefined
                );
                sparksUsed = this.DEEP_MAP_COST;
            }

            // Create initial energy map
            const energyMap = await this.databaseService.energyMap.create({
                data: {
                    userId,
                    focus: createDto.focus,
                    name: createDto.name,
                    dateOfBirth: new Date(createDto.dateOfBirth),
                    status: EnergyMapStatus.PROCESSING,
                    leftPalmImageKey: createDto.leftPalmImageKey,
                    rightPalmImageKey: createDto.rightPalmImageKey,
                    faceImageKey: createDto.faceImageKey,
                    sparksUsed,
                    strengths: [],
                    challenges: [],
                    careerTendencies: [],
                    relationshipPatterns: [],
                    adjustmentStrategies: [],
                },
            });

            // Process analysis based on image keys
            if (hasAllImageKeys) {
                // Process deep map analysis
                await this.processDeepMap(energyMap.id, {
                    leftPalmImageKey: createDto.leftPalmImageKey,
                    rightPalmImageKey: createDto.rightPalmImageKey,
                    faceImageKey: createDto.faceImageKey,
                });
            } else {
                // Process simple map analysis
                await this.processSimpleMap(energyMap.id, createDto);
            }

            return this.getEnergyMap(userId, energyMap.id);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'energy-map.error.failedToCreate',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getEnergyMap(
        userId: string,
        energyMapId: string
    ): Promise<EnergyMapResponseDto> {
        try {
            const energyMap = await this.databaseService.energyMap.findFirst({
                where: { id: energyMapId, userId },
            });

            if (!energyMap) {
                throw new HttpException(
                    'energy-map.error.notFound',
                    HttpStatus.NOT_FOUND
                );
            }

            return this.mapToResponseDto(energyMap);
        } catch (error) {
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                'energy-map.error.failedToGet',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    async getUserEnergyMaps(userId: string): Promise<EnergyMapResponseDto[]> {
        try {
            const energyMaps = await this.databaseService.energyMap.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            return energyMaps.map(this.mapToResponseDto);
        } catch (_error) {
            throw new HttpException(
                'energy-map.error.failedToGetUserMaps',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private async processSimpleMap(
        energyMapId: string,
        createDto: CreateEnergyMapDto
    ): Promise<void> {
        try {
            // Generate simple map insights
            const analysis =
                await this.analysisService.generateSimpleMapAnalysis({
                    focus: createDto.focus,
                    dateOfBirth: new Date(createDto.dateOfBirth),
                    name: createDto.name,
                });

            // Update energy map with results
            await this.databaseService.energyMap.update({
                where: { id: energyMapId },
                data: {
                    corePattern: analysis.corePattern,
                    strengths: analysis.strengths,
                    challenges: analysis.challenges,
                    careerTendencies: analysis.careerTendencies,
                    relationshipPatterns: analysis.relationshipPatterns,
                    status: EnergyMapStatus.COMPLETED,
                },
            });
        } catch (error) {
            await this.databaseService.energyMap.update({
                where: { id: energyMapId },
                data: { status: EnergyMapStatus.FAILED },
            });
            throw error;
        }
    }

    private async processDeepMap(
        energyMapId: string,
        imageKeys: {
            leftPalmImageKey?: string;
            rightPalmImageKey?: string;
            faceImageKey?: string;
        }
    ): Promise<void> {
        try {
            // First process simple map analysis (always needed)
            const energyMap = await this.databaseService.energyMap.findUnique({
                where: { id: energyMapId },
            });

            if (!energyMap) {
                throw new HttpException(
                    'energy-map.error.notFound',
                    HttpStatus.NOT_FOUND
                );
            }

            // Generate simple map insights first
            const simpleAnalysis =
                await this.analysisService.generateSimpleMapAnalysis({
                    focus: energyMap.focus,
                    dateOfBirth: energyMap.dateOfBirth,
                    name: energyMap.name,
                });

            // Generate deep map insights using AI analysis of images
            const deepAnalysis =
                await this.analysisService.generateDeepMapAnalysis({
                    leftPalmImageKey: imageKeys.leftPalmImageKey,
                    rightPalmImageKey: imageKeys.rightPalmImageKey,
                    faceImageKey: imageKeys.faceImageKey,
                });

            // Update energy map with both simple and deep results
            await this.databaseService.energyMap.update({
                where: { id: energyMapId },
                data: {
                    // Simple map results
                    corePattern: simpleAnalysis.corePattern,
                    strengths: simpleAnalysis.strengths,
                    challenges: simpleAnalysis.challenges,
                    careerTendencies: simpleAnalysis.careerTendencies,
                    relationshipPatterns: simpleAnalysis.relationshipPatterns,
                    // Deep map results
                    patternExplanation: deepAnalysis.patternExplanation,
                    timingInsights: deepAnalysis.timingInsights,
                    evolutionPath: deepAnalysis.evolutionPath,
                    adjustmentStrategies: deepAnalysis.adjustmentStrategies,
                    status: EnergyMapStatus.COMPLETED,
                },
            });
        } catch (error) {
            await this.databaseService.energyMap.update({
                where: { id: energyMapId },
                data: { status: EnergyMapStatus.FAILED },
            });
            throw error;
        }
    }

    private mapToResponseDto(energyMap: any): EnergyMapResponseDto {
        return {
            id: energyMap.id,
            focus: energyMap.focus,
            status: energyMap.status,
            name: energyMap.name,
            dateOfBirth: energyMap.dateOfBirth,
            corePattern: energyMap.corePattern || [],
            strengths: energyMap.strengths || [],
            challenges: energyMap.challenges || [],
            careerTendencies: energyMap.careerTendencies || [],
            relationshipPatterns: energyMap.relationshipPatterns || [],
            patternExplanation: energyMap.patternExplanation || [],
            timingInsights: energyMap.timingInsights || [],
            evolutionPath: energyMap.evolutionPath || [],
            adjustmentStrategies: energyMap.adjustmentStrategies || [],
            sparksUsed: energyMap.sparksUsed,
            createdAt: energyMap.createdAt,
            updatedAt: energyMap.updatedAt,
            deletedAt: energyMap.deletedAt,
        };
    }
}
