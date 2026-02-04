import { Router, Request, Response } from 'express';
import Post from '../models/Post';
import User from '../models/User';

const router = Router();

// 获取帖子列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query: any = {};

    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const posts = await Post.find(query)
      .populate('authorId', 'nickname avatar role stats')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await Post.countDocuments(query);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch posts',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 获取帖子详情
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const post = await Post.findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } },
      { new: true }
    )
      .populate('authorId', 'nickname avatar role stats')
      .populate('replies.authorId', 'nickname avatar role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 发布新帖子
router.post('/', async (req: Request, res: Response) => {
  try {
    const { authorId, title, content, attachments, mentions } = req.body;

    if (!authorId || !title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const post = new Post({
      authorId,
      title,
      content,
      attachments: attachments || [],
      mentions: mentions || [],
      status: 'pending',
      replies: [],
      viewCount: 0,
    });

    await post.save();

    await User.findByIdAndUpdate(authorId, {
      $inc: { 'stats.questionsCount': 1 },
    });

    res.status(201).json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 回复帖子
router.post('/:id/reply', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { authorId, content } = req.body;

    if (!authorId || !content) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const post = await Post.findByIdAndUpdate(
      id,
      {
        $push: {
          replies: {
            authorId,
            content,
            isAdopted: false,
            likes: 0,
            subReplies: [],
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    ).populate('replies.authorId', 'nickname avatar role');

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    await User.findByIdAndUpdate(authorId, {
      $inc: { 'stats.answersCount': 1 },
    });

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to reply to post',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 采纳答案
router.post('/:id/adopt', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { replyId } = req.body;

    if (!replyId) {
      return res.status(400).json({
        success: false,
        message: 'Reply ID is required',
      });
    }

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const reply = post.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    reply.isAdopted = true;
    post.status = 'resolved';

    await post.save();

    await User.findByIdAndUpdate(reply.authorId, {
      $inc: { 'stats.adoptedCount': 1 },
    });

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to adopt answer',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 点赞回复
router.post('/replies/:replyId/like', async (req: Request, res: Response) => {
  try {
    const { replyId } = req.params;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({
        success: false,
        message: 'Post ID is required',
      });
    }

    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const reply = post.replies.id(replyId);

    if (!reply) {
      return res.status(404).json({
        success: false,
        message: 'Reply not found',
      });
    }

    reply.likes += 1;
    await post.save();

    res.json({
      success: true,
      data: reply,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to like reply',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
