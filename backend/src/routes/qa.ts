import { Router, Request, Response } from 'express';
import QAKnowledge from '../models/QA';
import fs from 'fs';
import path from 'path';

const router = Router();
const extractedCommentStore = new Map<string, any[]>();

const ensureAuthor = (author: any) => ({
  id: author?.id || 'anonymous',
  name: author?.name || '匿名',
  avatar: author?.avatar,
  role: author?.role || 'member',
});

// 获取指定日期的Q&A列表
router.get('/daily', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const qas = await QAKnowledge.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: qas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Q&A list',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 搜索Q&A
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { keyword, tags } = req.query;
    const query: any = {};

    if (keyword) {
      query.$text = { $search: keyword as string };
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tags = { $in: tagArray };
    }

    const qas = await QAKnowledge.find(query).sort({ createdAt: -1 }).limit(50);

    res.json({
      success: true,
      data: qas,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 获取每日概览
router.get('/brief', async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();

    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const qas = await QAKnowledge.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    const allTags = qas.flatMap((qa) => qa.tags);
    const tagCounts = allTags.reduce((acc: any, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});

    const topTags = Object.entries(tagCounts)
      .sort(([, a]: any, [, b]: any) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    const brief = {
      date: targetDate,
      summary: `今天共沉淀了 ${qas.length} 条知识，涵盖了${topTags.join('、')}等多个领域。`,
      totalQuestions: qas.length,
      totalAnswers: qas.length,
      topTags,
    };

    res.json({
      success: true,
      data: brief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily brief',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 获取有内容的日期列表
router.get('/dates', async (req: Request, res: Response) => {
  try {
    const { month } = req.query;
    let startDate: Date;
    let endDate: Date;

    if (month) {
      const [year, monthNum] = (month as string).split('-');
      startDate = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
      endDate = new Date(parseInt(year), parseInt(monthNum), 0, 23, 59, 59);
    } else {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      endDate = new Date();
    }

    const dates = await QAKnowledge.distinct('date', {
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    });

    res.json({
      success: true,
      data: dates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dates',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 提交反馈
router.post('/feedback', async (req: Request, res: Response) => {
  try {
    const { qaId, type } = req.body;

    if (!qaId || !type || !['useful', 'useless'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request parameters',
      });
    }

    const updateField = type === 'useful' ? 'feedback.useful' : 'feedback.useless';

    const qa = await QAKnowledge.findByIdAndUpdate(
      qaId,
      { $inc: { [updateField]: 1 } },
      { new: true }
    );

    if (!qa) {
      return res.status(404).json({
        success: false,
        message: 'Q&A not found',
      });
    }

    res.json({
      success: true,
      data: qa,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 获取从群聊提取的知识库
router.get('/extracted', (req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, '../../extracted_qa.md');

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: '知识库文件不存在',
      });
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const qaList = parseMarkdownToQA(content);

    res.json({
      success: true,
      data: qaList,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '读取知识库失败',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 获取评论列表
router.get('/:qaId/comments', async (req: Request, res: Response) => {
  const { qaId } = req.params;
  try {
    if (qaId.startsWith('extracted_')) {
      const comments = extractedCommentStore.get(qaId) || [];
      return res.json({ success: true, data: comments });
    }

    const qa = await QAKnowledge.findById(qaId);
    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A not found' });
    }

    return res.json({ success: true, data: qa.comments || [] });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch comments',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 新增评论
router.post('/:qaId/comments', async (req: Request, res: Response) => {
  const { qaId } = req.params;
  const { author, content, images } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: 'content required' });
  }
  const comment = {
    id: `c_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    author: ensureAuthor(author),
    content,
    images: Array.isArray(images) ? images : [],
    likes: 0,
    likedUserIds: [],
    replies: [],
    createdAt: new Date(),
  };
  try {
    if (qaId.startsWith('extracted_')) {
      const comments = extractedCommentStore.get(qaId) || [];
      comments.push(comment);
      extractedCommentStore.set(qaId, comments);
      return res.json({ success: true, data: comment });
    }

    const qa = await QAKnowledge.findById(qaId);
    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A not found' });
    }
    qa.comments = qa.comments || [];
    qa.comments.push(comment);
    await qa.save();
    return res.json({ success: true, data: comment });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 新增回复
router.post('/:qaId/comments/:commentId/replies', async (req: Request, res: Response) => {
  const { qaId, commentId } = req.params;
  const { author, content, replyTo, images } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, message: 'content required' });
  }
  const reply = {
    id: `r_${Date.now()}_${Math.random().toString(16).slice(2)}`,
    author: ensureAuthor(author),
    content,
    replyTo,
    images: Array.isArray(images) ? images : [],
    likes: 0,
    likedUserIds: [],
    createdAt: new Date(),
  };
  try {
    if (qaId.startsWith('extracted_')) {
      const comments = extractedCommentStore.get(qaId) || [];
      const target = comments.find((item: any) => item.id === commentId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }
      target.replies = target.replies || [];
      target.replies.push(reply);
      extractedCommentStore.set(qaId, comments);
      return res.json({ success: true, data: reply });
    }

    const qa = await QAKnowledge.findById(qaId);
    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A not found' });
    }
    const comment = qa.comments?.find((item: any) => item.id === commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    comment.replies = comment.replies || [];
    comment.replies.push(reply);
    await qa.save();
    return res.json({ success: true, data: reply });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 评论点赞
router.post('/:qaId/comments/:commentId/like', async (req: Request, res: Response) => {
  const { qaId, commentId } = req.params;
  const { userId } = req.body;
  const likeUser = userId || 'anonymous';
  try {
    if (qaId.startsWith('extracted_')) {
      const comments = extractedCommentStore.get(qaId) || [];
      const target = comments.find((item: any) => item.id === commentId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }
      target.likedUserIds = target.likedUserIds || [];
      const hasLiked = target.likedUserIds.includes(likeUser);
      target.likedUserIds = hasLiked
        ? target.likedUserIds.filter((id: string) => id !== likeUser)
        : [...target.likedUserIds, likeUser];
      target.likes = target.likedUserIds.length;
      extractedCommentStore.set(qaId, comments);
      return res.json({ success: true, data: { likes: target.likes, liked: !hasLiked } });
    }

    const qa = await QAKnowledge.findById(qaId);
    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A not found' });
    }
    const comment = qa.comments?.find((item: any) => item.id === commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    comment.likedUserIds = comment.likedUserIds || [];
    const hasLiked = comment.likedUserIds.includes(likeUser);
    comment.likedUserIds = hasLiked
      ? comment.likedUserIds.filter((id: string) => id !== likeUser)
      : [...comment.likedUserIds, likeUser];
    comment.likes = comment.likedUserIds.length;
    await qa.save();
    return res.json({ success: true, data: { likes: comment.likes, liked: !hasLiked } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to like comment',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 回复点赞
router.post('/:qaId/comments/:commentId/replies/:replyId/like', async (req: Request, res: Response) => {
  const { qaId, commentId, replyId } = req.params;
  const { userId } = req.body;
  const likeUser = userId || 'anonymous';
  try {
    if (qaId.startsWith('extracted_')) {
      const comments = extractedCommentStore.get(qaId) || [];
      const target = comments.find((item: any) => item.id === commentId);
      if (!target) {
        return res.status(404).json({ success: false, message: 'Comment not found' });
      }
      const reply = (target.replies || []).find((item: any) => item.id === replyId);
      if (!reply) {
        return res.status(404).json({ success: false, message: 'Reply not found' });
      }
      reply.likedUserIds = reply.likedUserIds || [];
      const hasLiked = reply.likedUserIds.includes(likeUser);
      reply.likedUserIds = hasLiked
        ? reply.likedUserIds.filter((id: string) => id !== likeUser)
        : [...reply.likedUserIds, likeUser];
      reply.likes = reply.likedUserIds.length;
      extractedCommentStore.set(qaId, comments);
      return res.json({ success: true, data: { likes: reply.likes, liked: !hasLiked } });
    }

    const qa = await QAKnowledge.findById(qaId);
    if (!qa) {
      return res.status(404).json({ success: false, message: 'Q&A not found' });
    }
    const comment = qa.comments?.find((item: any) => item.id === commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }
    const reply = comment.replies?.find((item: any) => item.id === replyId);
    if (!reply) {
      return res.status(404).json({ success: false, message: 'Reply not found' });
    }
    reply.likedUserIds = reply.likedUserIds || [];
    const hasLiked = reply.likedUserIds.includes(likeUser);
    reply.likedUserIds = hasLiked
      ? reply.likedUserIds.filter((id: string) => id !== likeUser)
      : [...reply.likedUserIds, likeUser];
    reply.likes = reply.likedUserIds.length;
    await qa.save();
    return res.json({ success: true, data: { likes: reply.likes, liked: !hasLiked } });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to like reply',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 解析Markdown为QA结构
function parseMarkdownToQA(markdown: string) {
  const qaList: any[] = [];
  const lines = markdown.split('\n');

  let currentQA: any = null;
  let currentSection = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 匹配问题标题 ### Q1: xxx
    if (line.startsWith('### Q')) {
      if (currentQA) {
        qaList.push(currentQA);
      }

      const match = line.match(/### Q(\d+):\s*(.+)/);
      if (match) {
        currentQA = {
          _id: `extracted_${match[1]}`,
          question: match[2],
          answer: '',
          tags: [],
          category: 'practical',
          feedback: { useful: 0, useless: 0 },
          createdAt: new Date(),
          updatedAt: new Date(),
          date: new Date(),
        };
      }
      currentSection = 'question';
    }
    // 匹配标签 **标签:** #xxx #yyy
    else if (line.startsWith('**标签:**')) {
      const tags = line.match(/#[\u4e00-\u9fa5a-zA-Z0-9]+/g);
      if (tags && currentQA) {
        currentQA.tags = tags.map((tag: string) => tag.substring(1));
      }
    }
    // 匹配回答部分
    else if (line.startsWith('**回答:**') || line.startsWith('**问题:**')) {
      currentSection = 'answer';
    }
    // 匹配来源
    else if (line.startsWith('**来源:**')) {
      continue;
    }
    // 匹配分隔线
    else if (line === '---') {
      continue;
    }
    // 收集答案内容
    else if (currentSection === 'answer' && line && currentQA) {
      if (currentQA.answer) {
        currentQA.answer += '\n' + line;
      } else {
        currentQA.answer = line;
      }
    }
  }

  // 添加最后一个QA
  if (currentQA) {
    qaList.push(currentQA);
  }

  // 根据标签判断分类
  qaList.forEach((qa: any) => {
    if (qa.tags.some((tag: string) => tag.includes('避坑') || tag.includes('违规') || tag.includes('限流'))) {
      qa.category = 'pitfall';
    } else if (qa.tags.some((tag: string) => tag.includes('逻辑') || tag.includes('原理') || tag.includes('规则'))) {
      qa.category = 'logic';
    } else {
      qa.category = 'practical';
    }
  });

  return qaList;
}

export default router;
