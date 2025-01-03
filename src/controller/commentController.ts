import { Controller, Get, Post, Delete, Param, Body, Put, UseGuards, Query } from '@nestjs/common';
import { Comment } from '../model/comment'
import { RolesGuard } from '../guard/rolesGuard';
import { AuthGuard } from '../guard/authGuard';
import { Roles } from '../guard/roles';

@Controller('comment')
@UseGuards(AuthGuard)
export class CommentController {
  @Get(':targetId')
  getComments(@Param('targetId') targetId: string, @Query("page") page: number, @Query("size") size: number) {
    // todo: returns comments for a course or lesson with pagination
  }

  @Post(':targetId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  addComment(@Param('targetId') targetId: string, @Body() createCommentDto: Comment) {
    // todo: adds a comment to a course or lesson
  }

  @Put(':commentId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  updateComment(@Param('commentId') commentId: string, text: string) {
    // todo: changes a certain comment's text
  }

  @Delete(':commentId')
  @Roles('USER', 'ADMIN', 'AUTHOR')
  @UseGuards(RolesGuard)
  deleteComment(@Param('commentId') commentId: string) {
    // todo: deletes a comment
  }
}
