import { Module } from '@nestjs/common';

import { DatabaseModule } from 'src/common/database/database.module';

import { SparkPublicController } from './controllers/spark.public.controller';
import { SparkService } from './services/spark.service';

@Module({
    imports: [DatabaseModule],
    controllers: [SparkPublicController],
    providers: [SparkService],
    exports: [SparkService],
})
export class SparkModule {}
