import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Put,
  UseGuards,
  Query,
  Logger,
  Inject,
  BadRequestException, ParseIntPipe,
} from '@nestjs/common';
import { Comment } from '../model/comment'
import { RolesGuard } from '../guard/rolesGuard';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CommentService } from '../service/commentService';
import { validate } from 'uuid';

@ApiTags('Comment')
@ApiBearerAuth()
@Controller('comment')
@UseGuards(AuthGuard)
export class CommentController {
  private readonly logger = new Logger(CommentController.name);
  private commentService: CommentService;

  constructor(@Inject() commentService: CommentService) {
    this.commentService = commentService;
  }

  @Get(':targetId')
  @ApiOperation({ summary: 'Get comments for a target with pagination' })
  @ApiParam({ name: 'targetId', description: 'ID of the course or lesson', type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getComments(@Param('targetId') targetId: string, @Query("page", ParseIntPipe) page: number, @Query("size", ParseIntPipe) size: number) {
    this.logger.log(`GET /comment/${targetId} | Fetching comments with page=${page}, size=${size}`);
    if (!validate(targetId)) {
      this.logger.warn(`GET /comments/${targetId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format');
    }
    return this.commentService.getComments(targetId, page, size);
  }

  @Post(':targetId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add a comment to a course or lesson' })
  @ApiParam({ name: 'targetId', description: 'ID of the course or lesson', type: String })
  @ApiBody({ description: 'Comment to be added', type: Comment })
  addComment(@Param('targetId') targetId: string, @Body() comment: Comment) {
    this.logger.log(`POST /comment/${targetId} | Adding comments`);
    if (!validate(targetId)) {
      this.logger.warn(`POST /comments/${targetId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format');
    }
    return this.commentService.addComment(targetId, comment);
  }

  @Put(':commentId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a comment by ID' })
  @ApiParam({ name: 'commentId', description: 'ID of the comment to update', type: String })
  @ApiBody({ description: 'Updated text for the comment', schema: { example: { text: 'Updated comment text' } } })
  updateComment(@Param('commentId') commentId: string, @Body() comment: { text: string }) {
    const text = comment.text;
    this.logger.log(`PUT /comment/${commentId} | Updating comment with text: "${text}"`);
    if (!validate(commentId)) {
      this.logger.warn(`PUT /comments/${commentId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format');
    }
    return this.commentService.updateComment(commentId, text);
  }

  @Delete(':commentId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a comment by ID' })
  @ApiParam({ name: 'commentId', description: 'ID of the comment to delete', type: String })
  deleteComment(@Param('commentId') commentId: string) {
    this.logger.log(`DELETE /comment/${commentId} | Deleting comment`);
    if (!validate(commentId)) {
      this.logger.warn(`DELETE /comments/${commentId} | Invalid ID format`);
      throw new BadRequestException('Invalid ID format');
    }
    return this.commentService.deleteComment(commentId);
  }
}
