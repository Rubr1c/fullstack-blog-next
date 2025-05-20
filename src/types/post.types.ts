import { Post } from '@/generated/prisma';

export type PostDTO = {
  id: string;
  title: string;
  slug: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  //TODO: add media and comments DTO
};


export function createPostDto(post: Post): PostDTO {
  return {
    ...post,
    authorId: post.authorId.toString(),
  };
}
