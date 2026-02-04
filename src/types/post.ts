export interface Post {
  _id: string;
  authorId: string;
  author?: User;
  title: string;
  content: PostContent;
  attachments: Attachment[];
  status: 'pending' | 'resolved';
  mentions: string[];
  replies: Reply[];
  viewCount: number;
  allowReplies?: boolean;
  aiSummary?: string;
  aiHistory?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PostContent {
  stage: string;
  problem: string;
  attempts: string;
}

export interface Attachment {
  type: 'image' | 'video';
  url: string;
}

export interface Reply {
  _id: string;
  authorId: string;
  author?: User;
  content: string;
  isAdopted: boolean;
  likes: number;
  subReplies: SubReply[];
  createdAt: Date;
}

export interface SubReply {
  _id: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: Date;
}

export interface User {
  _id: string;
  nickname: string;
  avatar: string;
  role: 'member' | 'assistant' | 'captain';
  wechatId?: string;
  stats: UserStats;
  createdAt: Date;
}

export interface UserStats {
  questionsCount: number;
  answersCount: number;
  adoptedCount: number;
}

export interface CreatePostData {
  title: string;
  content: PostContent;
  attachments?: Attachment[];
  mentions?: string[];
  allowReplies?: boolean;
  includeAI?: boolean;
  aiSummary?: string;
  aiHistory?: string;
}

export interface CreateReplyData {
  postId: string;
  content: string;
}
