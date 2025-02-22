import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Comment } from '../model/comment';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async getComments(
    targetId: string,
    page: number = 1,
    size: number = 10,
  ): Promise<{
    comments: Comment[];
    total: number;
    page: number;
    size: number;
  }> {
    this.logger.log(
      `Fetching comments for targetId=${targetId}, page=${page}, size=${size}`,
    );

    const skip = (page - 1) * size;

    const [comments, total] = await this.commentRepository.findAndCount({
      where: { targetId },
      skip,
      take: size,
    });

    this.logger.log(
      `Fetched ${comments.length} comments out of ${total} total matching comments.`,
    );
    return { comments, total, page, size };
  }

  async addComment(
    targetId: string,
    comment: Partial<Comment>,
  ): Promise<Comment> {
    this.logger.log(`Adding a comment to targetId=${targetId}`);

    const savedComment = await this.commentRepository.save(
      Object.assign(comment, { targetId: targetId }),
    );
    this.logger.log(`Comment added successfully with ID: ${savedComment._id}`);
    return savedComment;
  }

  async updateComment(commentId: string, text: string): Promise<Comment> {
    this.logger.log(`Updating comment: ID=${commentId}, text="${text}"`);

    if (!text || text.trim() === '') {
      this.logger.warn('Empty text provided for the comment.');
      throw new BadRequestException(
        'Text for the comment must be provided and cannot be empty.',
      );
    }

    const result = await this.commentRepository
      .createQueryBuilder()
      .update(Comment)
      .set({ text })
      .where('_id = :id', { id: commentId })
      .returning('*')
      .execute();

    if (!result.raw?.[0]) {
      this.logger.warn(`Comment not found: ID=${commentId}`);
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    const updatedComment = result.raw[0];
    this.logger.log(`Comment updated successfully: ID=${commentId}`);
    return updatedComment;
  }

  async deleteComment(commentId: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete comment: ID=${commentId}`);

    const result = await this.commentRepository.delete(commentId);

    if (result.affected === 0) {
      this.logger.warn(`Comment not found: ID=${commentId}`);
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    this.logger.log(`Comment deleted successfully: ID=${commentId}`);
    return {
      message: `Comment with ID "${commentId}" has been deleted successfully.`,
    };
  }
}
