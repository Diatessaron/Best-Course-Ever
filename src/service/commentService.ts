import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Collection, Db, DeleteResult, InsertOneResult, ObjectId, UpdateResult } from 'mongodb';
import { Comment } from '../model/comment';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);
  private commentCollection: Collection<Comment>;

  constructor(
    @Inject('DATABASE_CONNECTION') private readonly db: Db,
  ) {
    this.commentCollection = db.collection('comments');
  }

  async getComments(
    targetId: string,
    page: number = 1,
    size: number = 10,
  ): Promise<{ comments: Comment[]; total: number; page: number; size: number }> {
    this.logger.log(`Fetching comments for targetId=${targetId}, page=${page}, size=${size}`);

    const skip = (page - 1) * size;

    const [comments, total] = await Promise.all([
      this.commentCollection.find({ targetId: targetId }).skip(skip).limit(size).toArray(),
      this.commentCollection.countDocuments({ targetId: targetId }),
    ]);

    this.logger.log(`Fetched ${comments.length} comments out of ${total} total matching comments.`);
    return { comments, total, page, size };
  }

  async addComment(targetId: string, comment: Comment): Promise<Comment> {
    this.logger.log(`Adding a comment to targetId=${targetId}`);

    const result: InsertOneResult<Comment> = await this.commentCollection.insertOne(comment);

    if (!result.acknowledged) {
      this.logger.error('Failed to insert the new comment into the database.');
      throw new BadRequestException('Failed to add the comment.');
    }

    this.logger.log(`Comment added successfully with ID: ${result.insertedId}`);
    return comment;
  }

  async updateComment(commentId: string, text: string): Promise<Comment> {
    this.logger.log(`Updating comment: ID=${commentId}, text="${text}"`);

    if (!text || text.trim() === '') {
      this.logger.warn('Empty text provided for the comment.');
      throw new BadRequestException('Text for the comment must be provided and cannot be empty.');
    }

    const result: UpdateResult = await this.commentCollection.updateOne(
      { _id: commentId },
      { $set: { text: text } },
    );

    if (result.matchedCount === 0) {
      this.logger.warn(`Comment not found: ID=${commentId}`);
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    const updatedComment = await this.commentCollection.findOne({ commentId });
    this.logger.log(`Comment updated successfully: ID=${commentId}`);
    return updatedComment;
  }

  async deleteComment(commentId: string): Promise<{ message: string }> {
    this.logger.log(`Attempting to delete comment: ID=${commentId}`);

    const result: DeleteResult = await this.commentCollection.deleteOne({ _id: commentId });

    if (result.deletedCount === 0) {
      this.logger.warn(`Comment not found: ID=${commentId}`);
      throw new NotFoundException(`Comment with ID "${commentId}" not found.`);
    }

    this.logger.log(`Comment deleted successfully: ID=${commentId}`);
    return { message: `Comment with ID "${commentId}" has been deleted successfully.` };
  }
}
