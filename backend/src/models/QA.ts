import mongoose, { Schema, Document } from 'mongoose';

export interface IQAKnowledge extends Document {
  date: Date;
  question: string;
  answer: string;
  category: 'practical' | 'pitfall' | 'logic';
  tags: string[];
  comments?: Array<{
    id: string;
    author: {
      id: string;
      name: string;
      avatar?: string;
      role?: 'captain' | 'assistant' | 'member';
    };
    content: string;
    images?: string[];
    likes?: number;
    likedUserIds?: string[];
    replies?: Array<{
      id: string;
      author: {
        id: string;
        name: string;
        avatar?: string;
        role?: 'captain' | 'assistant' | 'member';
      };
      content: string;
      replyTo?: {
        id: string;
        name: string;
      };
      images?: string[];
      likes?: number;
      likedUserIds?: string[];
      createdAt?: Date;
    }>;
    createdAt?: Date;
  }>;
  alternatives?: Array<{
    title: string;
    content: string;
  }>;
  originalChat?: string;
  feedback: {
    useful: number;
    useless: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const QAKnowledgeSchema = new Schema<IQAKnowledge>(
  {
    date: { type: Date, required: true, index: true },
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: {
      type: String,
      enum: ['practical', 'pitfall', 'logic'],
      required: true,
    },
    tags: [{ type: String, index: true }],
    alternatives: [
      {
        title: String,
        content: String,
      },
    ],
    comments: [
      {
        id: { type: String, required: true },
        author: {
          id: { type: String, required: true },
          name: { type: String, required: true },
          avatar: String,
          role: { type: String, enum: ['captain', 'assistant', 'member'], default: 'member' },
        },
        content: { type: String, required: true },
        images: [String],
        likes: { type: Number, default: 0 },
        likedUserIds: [String],
        replies: [
          {
            id: { type: String, required: true },
            author: {
              id: { type: String, required: true },
              name: { type: String, required: true },
              avatar: String,
              role: { type: String, enum: ['captain', 'assistant', 'member'], default: 'member' },
            },
            content: { type: String, required: true },
            replyTo: {
              id: String,
              name: String,
            },
            images: [String],
            likes: { type: Number, default: 0 },
            likedUserIds: [String],
            createdAt: { type: Date, default: Date.now },
          },
        ],
        createdAt: { type: Date, default: Date.now },
      },
    ],
    originalChat: String,
    feedback: {
      useful: { type: Number, default: 0 },
      useless: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

QAKnowledgeSchema.index({ question: 'text', answer: 'text', tags: 'text' });

export default mongoose.model<IQAKnowledge>('QAKnowledge', QAKnowledgeSchema);
