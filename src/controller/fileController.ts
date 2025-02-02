import {
  BadRequestException,
  Controller,
  Inject,
  Logger, Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileService } from '../service/fileService';
import { AuthGuard } from '../common/guard/authGuard';
import { Roles } from '../common/guard/roles';
import { RolesGuard } from '../common/guard/rolesGuard';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

@Controller('file')
@UseGuards(AuthGuard)
@ApiTags('file')
@ApiBearerAuth()
export class FileController {
  private readonly logger = new Logger(FileController.name);
  private fileService: FileService;

  constructor(@Inject() fileService: FileService) {
    this.fileService = fileService;
  }

  @Post()
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file',
    description: 'Allows uploading a binary file associated with a specific lecture ID.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'File upload',
    schema: {
      type: 'object',
      properties: {
        lectureId: {
          type: 'string',
          description: 'The ID of the lecture the file is associated with.',
        },
        file: {
          type: 'string',
          format: 'binary',
          description: 'The file to upload.',
        },
      },
      required: ['lectureId', 'file'],
    },
  })
  @ApiParam({
    name: 'lectureId',
    type: 'string',
    description: 'The ID of the lecture the file is associated with.',
  })
  saveFile(@Param('lectureId') lectureId: string, @UploadedFile() file: Express.Multer.File) {
    this.logger.log('POST /file | Saving a binary file')
    if (!file) {
      this.logger.error('POST /file | File is empty')
      throw new BadRequestException('No file uploaded');
    }

    return this.fileService.saveFile(lectureId, file);
  }
}
