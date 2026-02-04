import mongoose, { Schema, Document } from 'mongoose';

interface ISubReply {
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
}

interface IReply {
  authorId: mongoose.Types.ObjectId;
  content: string;
  isAdopted: boolean;
  likes: number;
  subReplies: ISubReply[];
  createdAt: Date;
}

export interface IPost extends Document {
  authorId: mongoose.Types.ObjectId;
  title: string;
  content: {
    stage: string;
    problem: string;
    attempts: string;
  };
  attachments: Array<{
    type: 'image' | 'video';
    url: string;
  }>;
  status: 'pending' | 'resolved';
  mentions: mongoose.Types.ObjectId[];
  replies: IReply[];
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubReplySchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const ReplySchema = new Schema({
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  isAdopted: { type: Boolean, default: false },
  likes: { type: Number, default: 0 },
  subReplies: [SubReplySchema],
  createdAt: { type: Date, default: Date.now },
});

const PostSchema = new Schema<IPost>(
  {
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    content: {
      stage: { type: String, required: true },
      problem: { type: String, required: true },
      attempts: { type: String, required: true },
    },
    attachments: [
      {
        type: { type: String, enum: ['image', 'video'] },
        url: String,
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'resolved'],
      default: 'pending',
      index: true,
    },
    mentions: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    replies: [ReplySchema],
    viewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

PostSchema.index({ title: 'text', 'content.problem': 'text' });

export default mongoose.model<IPost>('Post', PostSchema);
