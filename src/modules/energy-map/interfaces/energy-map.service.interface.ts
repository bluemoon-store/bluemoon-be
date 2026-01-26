import { CreateEnergyMapDto } from '../dtos/request/energy-map-create.request';
import { EnergyMapResponseDto } from '../dtos/response/energy-map.response';

export interface IEnergyMapService {
    createEnergyMap(
        userId: string,
        createDto: CreateEnergyMapDto
    ): Promise<EnergyMapResponseDto>;
    getEnergyMap(
        userId: string,
        energyMapId: string
    ): Promise<EnergyMapResponseDto>;
    getUserEnergyMaps(userId: string): Promise<EnergyMapResponseDto[]>;
}
