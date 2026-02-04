export interface QAKnowledge {
  _id: string;
  date: Date;
  question: string;
  answer: string;
  category: 'practical' | 'pitfall' | 'logic';
  tags: string[];
  steps?: QAStep[];
  likedUsers?: QAUser[];
  comments?: QAComment[];
  alternatives?: Alternative[];
  originalChat?: string;
  feedback: {
    useful: number;
    useless: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Alternative {
  title: string;
  content: string;
}

export interface QAStep {
  title?: string;
  content: string;
}

export interface QAUser {
  id: string;
  name: string;
  avatar?: string;
  role?: 'captain' | 'assistant' | 'member';
}

export interface QAComment {
  id: string;
  author: QAUser;
  content: string;
  images?: string[];
  likes?: number;
  likedUserIds?: string[];
  replies?: QAReply[];
  createdAt?: Date;
}

export interface QAReply {
  id: string;
  author: QAUser;
  content: string;
  replyTo?: QAUser;
  images?: string[];
  likes?: number;
  likedUserIds?: string[];
  createdAt?: Date;
}

export interface DailyBrief {
  date: Date;
  summary: string;
  totalQuestions: number;
  totalAnswers: number;
  topTags: string[];
}

export interface QAFeedback {
  qaId: string;
  type: 'useful' | 'useless';
}
