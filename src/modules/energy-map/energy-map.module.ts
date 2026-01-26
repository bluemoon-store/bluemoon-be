import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';
import { HelperModule } from 'src/common/helper/helper.module';
import { FileModule } from 'src/common/file/file.module';
import { AwsModule } from 'src/common/aws/aws.module';
import { SparkModule } from 'src/modules/spark/spark.module';

import { EnergyMapController } from './controllers/energy-map.public.controller';
import { EnergyMapService } from './services/energy-map.service';
import { EnergyMapAnalysisService } from './services/energy-map-analysis.service';

@Module({
    imports: [DatabaseModule, HelperModule, FileModule, AwsModule, SparkModule],
    controllers: [EnergyMapController],
    providers: [EnergyMapService, EnergyMapAnalysisService],
    exports: [EnergyMapService],
})
export class EnergyMapModule {}
