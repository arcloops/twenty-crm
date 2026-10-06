import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ApplicationEntity } from 'src/engine/core-modules/application/application.entity';
import { BusinessCardResolver } from 'src/engine/core-modules/business-card/resolvers/business-card.resolver';
import { BusinessCardOcrService } from 'src/engine/core-modules/business-card/services/business-card-ocr.service';
import { BusinessCardService } from 'src/engine/core-modules/business-card/services/business-card.service';
import { FileStorageModule } from 'src/engine/core-modules/file-storage/file-storage.module';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { TwentyOrmModule } from 'src/engine/twenty-orm/twenty-orm.module';
import { provideWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/provide-workspace-scoped-repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([ApplicationEntity, FileEntity]),
    FileStorageModule,
    TwentyOrmModule,
  ],
  providers: [
    BusinessCardResolver,
    BusinessCardService,
    BusinessCardOcrService,
    provideWorkspaceScopedRepository(FileEntity),
  ],
  exports: [BusinessCardService],
})
export class BusinessCardModule {}
