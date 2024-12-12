import { Controller, Get, Post, Delete, Param, Body, Put, UseGuards, Query } from '@nestjs/common';
import { Comment } from '../model/comment'
import { RolesGuard } from '../guard/rolesGuard';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Comment')
@ApiBearerAuth()
@Controller('comment')
@UseGuards(AuthGuard)
export class CommentController {
  @Get(':targetId')
  @ApiOperation({ summary: 'Get comments for a target with pagination' })
  @ApiParam({ name: 'targetId', description: 'ID of the course or lesson', type: String })
  @ApiQuery({ name: 'page', description: 'Page number for pagination', required: false, type: Number })
  @ApiQuery({ name: 'size', description: 'Number of items per page', required: false, type: Number })
  getComments(@Param('targetId') targetId: string, @Query("page") page: number, @Query("size") size: number) {
    // todo: returns comments for a course or lesson with pagination
  }

  @Post(':targetId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Add a comment to a course or lesson' })
  @ApiParam({ name: 'targetId', description: 'ID of the course or lesson', type: String })
  @ApiBody({ description: 'Comment to be added', type: Comment })
  addComment(@Param('targetId') targetId: string, @Body() createCommentDto: Comment) {
    // todo: adds a comment to a course or lesson
  }

  @Put(':commentId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Update a comment by ID' })
  @ApiParam({ name: 'commentId', description: 'ID of the comment to update', type: String })
  @ApiBody({ description: 'Updated text for the comment', schema: { example: { text: 'Updated comment text' } } })
  updateComment(@Param('commentId') commentId: string, text: string) {
    // todo: changes a certain comment's text
  }

  @Delete(':commentId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Delete a comment by ID' })
  @ApiParam({ name: 'commentId', description: 'ID of the comment to delete', type: String })
  deleteComment(@Param('commentId') commentId: string) {
    // todo: deletes a comment
  }
}
