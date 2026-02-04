import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  nickname: string;
  avatar: string;
  role: 'member' | 'assistant' | 'captain';
  wechatId?: string;
  stats: {
    questionsCount: number;
    answersCount: number;
    adoptedCount: number;
  };
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    nickname: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: {
      type: String,
      enum: ['member', 'assistant', 'captain'],
      default: 'member',
    },
    wechatId: String,
    stats: {
      questionsCount: { type: Number, default: 0 },
      answersCount: { type: Number, default: 0 },
      adoptedCount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);
