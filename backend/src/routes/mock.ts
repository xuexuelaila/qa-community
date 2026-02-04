import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();
const commentStore = new Map<string, any[]>();

const ensureAuthor = (author: any) => ({
  id: author?.id || 'anonymous',
  name: author?.name || '匿名',
  avatar: author?.avatar,
  role: author?.role || 'member',
});

// Mock数据
const mockQAs = [
  {
    _id: '1',
    date: new Date(),
    question: '如何在Next.js 14中实现服务端渲染和客户端渲染的混合使用？',
    answer: '在Next.js 14的App Router中，默认所有组件都是服务端组件。如果需要使用客户端特性（如useState、useEffect等），需要在文件顶部添加 "use client" 指令。\n\n建议策略：\n1. 尽可能使用服务端组件，提升性能\n2. 只在需要交互的组件中使用 "use client"\n3. 将客户端组件拆分得更细粒度，减少客户端JavaScript体积',
    category: 'practical',
    tags: ['Next.js', 'React', 'SSR'],
    alternatives: [
      {
        title: '性能优先方案',
        content: '优先使用服务端组件，将所有数据获取逻辑放在服务端，客户端只负责交互。',
      },
      {
        title: '开发效率方案',
        content: '在开发阶段可以更多使用客户端组件，后期再优化为服务端组件。',
      },
    ],
    originalChat: '用户: Next.js 14怎么用啊？\n助手: 你具体想实现什么功能？\n用户: 我想做一个既有SSR又有交互的页面\n助手: 那你需要了解App Router的使用方式...',
    feedback: {
      useful: 15,
      useless: 2,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    date: new Date(),
    question: 'MongoDB索引设计有哪些常见的坑？',
    answer: '常见的坑包括：\n\n1. 过度索引：每个索引都会占用存储空间，并影响写入性能\n2. 索引顺序错误：复合索引的字段顺序很重要，应该把选择性高的字段放前面\n3. 忽略覆盖索引：合理使用覆盖索引可以避免回表查询\n4. 不监控索引使用情况：定期检查未使用的索引并删除',
    category: 'pitfall',
    tags: ['MongoDB', '数据库', '索引优化'],
    feedback: {
      useful: 23,
      useless: 1,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '3',
    date: new Date(),
    question: 'React中为什么要使用useCallback和useMemo？',
    answer: 'useCallback和useMemo是React性能优化的重要工具：\n\n**useCallback**: 缓存函数引用，避免子组件不必要的重渲染\n**useMemo**: 缓存计算结果，避免重复计算\n\n使用场景：\n1. 传递给子组件的回调函数\n2. 依赖数组中的函数\n3. 昂贵的计算操作\n\n注意：不要过度优化，只在确实有性能问题时使用。',
    category: 'logic',
    tags: ['React', '性能优化', 'Hooks'],
    feedback: {
      useful: 18,
      useless: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const mockPosts = [
  {
    _id: '1',
    authorId: '1',
    author: {
      _id: '1',
      nickname: '张三',
      avatar: '',
      role: 'member',
      stats: {
        questionsCount: 5,
        answersCount: 12,
        adoptedCount: 3,
      },
    },
    title: 'Next.js部署到Vercel后环境变量不生效',
    content: {
      stage: '部署阶段',
      problem: '我在本地开发时环境变量都正常，但是部署到Vercel后发现环境变量读取不到，导致API调用失败。',
      attempts: '已经在Vercel后台配置了环境变量，也重新部署了多次，但问题依然存在。',
    },
    attachments: [],
    status: 'pending',
    mentions: [],
    replies: [
      {
        _id: 'r1',
        authorId: '2',
        content: '你需要在环境变量前加上 NEXT_PUBLIC_ 前缀才能在客户端访问',
        isAdopted: false,
        likes: 5,
        subReplies: [],
        createdAt: new Date(),
      },
    ],
    viewCount: 45,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    authorId: '2',
    author: {
      _id: '2',
      nickname: '李四',
      avatar: '',
      role: 'assistant',
      stats: {
        questionsCount: 2,
        answersCount: 45,
        adoptedCount: 23,
      },
    },
    title: 'MongoDB聚合查询性能优化求助',
    content: {
      stage: '开发阶段',
      problem: '需要对百万级数据进行聚合查询，但是查询速度很慢，经常超时。',
      attempts: '已经添加了索引，但效果不明显。尝试过使用 $match 提前过滤，但还是很慢。',
    },
    attachments: [],
    status: 'resolved',
    mentions: [],
    replies: [
      {
        _id: 'r2',
        authorId: '3',
        author: {
          _id: '3',
          nickname: '王五',
          avatar: '',
          role: 'captain',
          stats: {
            questionsCount: 1,
            answersCount: 89,
            adoptedCount: 67,
          },
        },
        content: '建议使用 $lookup 的时候限制返回字段，并且确保关联字段都有索引。另外可以考虑使用物化视图。',
        isAdopted: true,
        likes: 12,
        subReplies: [],
        createdAt: new Date(),
      },
    ],
    viewCount: 128,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
];

const seedMockComments = () => {
  mockQAs.forEach((qa, index) => {
    const comments = [
      {
        id: `c_seed_${qa._id}_1`,
        author: { id: 'u1', name: '学员A', role: 'member' },
        content: '这个总结很实用，已经按步骤试了一遍。',
        images: [],
        likes: 2 + index,
        likedUserIds: ['u2', 'u3'].slice(0, 1 + (index % 2)),
        replies: [
          {
            id: `r_seed_${qa._id}_1`,
            author: { id: 'u2', name: '助教小李', role: 'assistant' },
            content: '如果遇到具体问题可以贴一下报错。',
            likes: 1,
            likedUserIds: ['u1'],
            createdAt: new Date(),
          },
        ],
        createdAt: new Date(),
      },
      {
        id: `c_seed_${qa._id}_2`,
        author: { id: 'u3', name: '学员B', role: 'member' },
        content: '有没有推荐的进一步学习资料？',
        images: [],
        likes: 0,
        likedUserIds: [],
        replies: [],
        createdAt: new Date(),
      },
    ];
    commentStore.set(qa._id, comments);
  });
};

seedMockComments();

// Mock Q&A endpoints
router.get('/qa/daily', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: mockQAs,
  });
});

router.get('/qa/search', (req: Request, res: Response) => {
  const { keyword } = req.query;
  const filtered = keyword
    ? mockQAs.filter(
        (qa) =>
          qa.question.includes(keyword as string) ||
          qa.answer.includes(keyword as string) ||
          qa.tags.some((tag) => tag.includes(keyword as string))
      )
    : mockQAs;

  res.json({
    success: true,
    data: filtered,
  });
});

router.get('/qa/brief', (req: Request, res: Response) => {
  const allTags = mockQAs.flatMap((qa) => qa.tags);
  const uniqueTags = [...new Set(allTags)];

  res.json({
    success: true,
    data: {
      date: new Date(),
      summary: `今天主要解决了Next.js部署、数据库优化和API设计等问题，涵盖了前端框架、性能优化和架构设计等多个领域。`,
      totalQuestions: mockQAs.length,
      totalAnswers: mockQAs.length,
      topTags: uniqueTags.slice(0, 5),
    },
  });
});

router.get('/qa/dates', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [new Date()],
  });
});

router.post('/qa/feedback', (req: Request, res: Response) => {
  const { qaId, type } = req.body;
  const qa = mockQAs.find((q) => q._id === qaId);

  if (qa) {
    if (type === 'useful') {
      qa.feedback.useful += 1;
    } else {
      qa.feedback.useless += 1;
    }
  }

  res.json({
    success: true,
    data: qa,
  });
});

// Mock 评论相关 endpoints
router.get('/qa/:qaId/comments', (req: Request, res: Response) => {
  const { qaId } = req.params;
  const comments = commentStore.get(qaId) || [];
  res.json({ success: true, data: comments });
});

router.post('/qa/:qaId/comments', (req: Request, res: Response) => {
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
  const list = commentStore.get(qaId) || [];
  list.push(comment);
  commentStore.set(qaId, list);
  res.json({ success: true, data: comment });
});

router.post('/qa/:qaId/comments/:commentId/replies', (req: Request, res: Response) => {
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
  const list = commentStore.get(qaId) || [];
  const target = list.find((item: any) => item.id === commentId);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  target.replies = target.replies || [];
  target.replies.push(reply);
  commentStore.set(qaId, list);
  res.json({ success: true, data: reply });
});

router.post('/qa/:qaId/comments/:commentId/like', (req: Request, res: Response) => {
  const { qaId, commentId } = req.params;
  const { userId } = req.body;
  const likeUser = userId || 'anonymous';
  const list = commentStore.get(qaId) || [];
  const target = list.find((item: any) => item.id === commentId);
  if (!target) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  target.likedUserIds = target.likedUserIds || [];
  const hasLiked = target.likedUserIds.includes(likeUser);
  target.likedUserIds = hasLiked
    ? target.likedUserIds.filter((id: string) => id !== likeUser)
    : [...target.likedUserIds, likeUser];
  target.likes = target.likedUserIds.length;
  commentStore.set(qaId, list);
  res.json({ success: true, data: { likes: target.likes, liked: !hasLiked } });
});

router.post('/qa/:qaId/comments/:commentId/replies/:replyId/like', (req: Request, res: Response) => {
  const { qaId, commentId, replyId } = req.params;
  const { userId } = req.body;
  const likeUser = userId || 'anonymous';
  const list = commentStore.get(qaId) || [];
  const target = list.find((item: any) => item.id === commentId);
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
  commentStore.set(qaId, list);
  res.json({ success: true, data: { likes: reply.likes, liked: !hasLiked } });
});

// 获取从群聊提取的知识库
router.get('/qa/extracted', (req: Request, res: Response) => {
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

// 获取提取知识库的概览信息
router.get('/qa/extracted-brief', (req: Request, res: Response) => {
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

    // 统计所有标签
    const allTags = qaList.flatMap((qa: any) => qa.tags);
    const tagCounts: { [key: string]: number } = {};
    allTags.forEach((tag: string) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });

    // 获取出现频率最高的5个标签
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag);

    // 统计分类
    const categories = {
      practical: qaList.filter((qa: any) => qa.category === 'practical').length,
      pitfall: qaList.filter((qa: any) => qa.category === 'pitfall').length,
      logic: qaList.filter((qa: any) => qa.category === 'logic').length,
    };

    // 生成概览文本
    const categoryTexts = [];
    if (categories.practical > 0) categoryTexts.push(`${categories.practical}个实操技巧`);
    if (categories.pitfall > 0) categoryTexts.push(`${categories.pitfall}个避坑指南`);
    if (categories.logic > 0) categoryTexts.push(`${categories.logic}个底层逻辑`);

    const summary = `本次从群聊中提取了${qaList.length}条核心知识，包括${categoryTexts.join('、')}，涵盖${topTags.slice(0, 3).join('、')}等多个领域的实战经验。`;

    const brief = {
      date: new Date(),
      summary,
      totalQuestions: qaList.length,
      totalAnswers: qaList.length,
      topTags,
    };

    res.json({
      success: true,
      data: brief,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '读取概览失败',
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
          originalChat: '', // 添加原始聊天记录字段
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
    // 匹配来源（作为原始记录）
    else if (line.startsWith('**来源:**')) {
      if (currentQA) {
        currentQA.originalChat = `来源：${line.replace('**来源:**', '').trim()}\n\n这是从群聊中提取的知识点，由以上教练/助教在群内解答。`;
      }
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

// Mock Posts endpoints
router.get('/posts', (req: Request, res: Response) => {
  const { status } = req.query;
  const filtered =
    status && status !== 'all'
      ? mockPosts.filter((post) => post.status === status)
      : mockPosts;

  res.json({
    success: true,
    data: {
      posts: filtered,
      pagination: {
        page: 1,
        limit: 20,
        total: filtered.length,
        totalPages: 1,
      },
    },
  });
});

router.get('/posts/:id', (req: Request, res: Response) => {
  const post = mockPosts.find((p) => p._id === req.params.id);

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
});

router.post('/posts', (req: Request, res: Response) => {
  const newPost = {
    _id: String(mockPosts.length + 1),
    ...req.body,
    status: 'pending',
    replies: [],
    viewCount: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockPosts.push(newPost as any);

  res.status(201).json({
    success: true,
    data: newPost,
  });
});

export default router;
