'use client';

import React, { useState, useEffect } from 'react';
import MainTabs from '@/components/common/MainTabs';
import DateRangePicker from '@/components/common/DateRangePicker';
import SmartTagBar from '@/components/log/SmartTagBar';
import QAGrid from '@/components/log/QAGrid';
import QACard from '@/components/log/QACard';
import QADetailModal from '@/components/log/QADetailModal';
import StatusTabs from '@/components/community/StatusTabs';
import QuestionForm from '@/components/community/QuestionForm';
import PostCard from '@/components/community/PostCard';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import Button from '@/components/common/Button';
import { QAKnowledge } from '@/types/qa';
import { Post, CreatePostData } from '@/types/post';
import styles from './page.module.css';

// Mock数据 - 航海日志
const mockQAs: QAKnowledge[] = [
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
  {
    _id: '4',
    date: new Date(),
    question: 'TypeScript中interface和type的区别是什么？',
    answer: 'interface和type都可以用来定义类型，但有一些区别：\n\n1. interface可以被继承和实现，type不行\n2. interface可以声明合并，type不行\n3. type可以定义联合类型和元组，interface不行\n\n建议：对象类型用interface，其他用type。',
    category: 'logic',
    tags: ['TypeScript', '类型系统'],
    feedback: {
      useful: 25,
      useless: 1,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '5',
    date: new Date(),
    question: '如何优化React应用的首屏加载速度？',
    answer: '优化首屏加载的方法：\n\n1. 代码分割：使用React.lazy和Suspense\n2. 图片优化：使用WebP格式，懒加载\n3. 减少bundle大小：tree shaking，按需引入\n4. 使用CDN加速静态资源\n5. 服务端渲染（SSR）',
    category: 'practical',
    tags: ['React', '性能优化', '首屏加载'],
    feedback: {
      useful: 32,
      useless: 2,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '6',
    date: new Date(),
    question: 'CSS Grid和Flexbox应该如何选择？',
    answer: 'Grid和Flexbox的选择原则：\n\n**Flexbox**：一维布局，适合导航栏、卡片排列\n**Grid**：二维布局，适合整体页面布局\n\n可以组合使用：Grid做整体布局，Flexbox做局部布局。',
    category: 'logic',
    tags: ['CSS', '布局', 'Grid', 'Flexbox'],
    feedback: {
      useful: 28,
      useless: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '7',
    date: new Date(),
    question: 'Git合并冲突如何解决？',
    answer: '解决Git冲突的步骤：\n\n1. git pull拉取最新代码\n2. 打开冲突文件，查看冲突标记\n3. 手动编辑，保留需要的代码\n4. 删除冲突标记（<<<<, ====, >>>>）\n5. git add添加解决后的文件\n6. git commit提交',
    category: 'practical',
    tags: ['Git', '版本控制', '冲突解决'],
    feedback: {
      useful: 20,
      useless: 1,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '8',
    date: new Date(),
    question: 'Docker容器和虚拟机有什么区别？',
    answer: 'Docker容器和虚拟机的主要区别：\n\n**容器**：共享宿主机内核，启动快，资源占用少\n**虚拟机**：完整的操作系统，隔离性更好，资源占用多\n\n容器适合微服务架构，虚拟机适合需要完全隔离的场景。',
    category: 'logic',
    tags: ['Docker', '容器', '虚拟化'],
    feedback: {
      useful: 35,
      useless: 2,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// Mock数据 - 求助站
const mockPosts: Post[] = [
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
      createdAt: new Date(),
    },
    title: 'Next.js部署到Vercel后环境变量不生效',
    content: {
      stage: 'tech',
      problem: '我在本地开发时环境变量都正常，但是部署到Vercel后发现环境变量读取不到，导致API调用失败。',
      attempts: '已经在Vercel后台配置了环境变量，也重新部署了多次，但问题依然存在。',
    },
    attachments: [],
    status: 'pending',
    mentions: ['教练小夏'],
    replies: [
      {
        _id: 'r1',
        authorId: '2',
        content: '你需要在环境变量前加上 NEXT_PUBLIC_ 前缀才能在客户端访问',
        isAdopted: false,
        likes: 5,
        subReplies: [
          {
            _id: 'sr1',
            authorId: '1',
            content: '感谢提醒，我去试试。',
            createdAt: new Date(),
          },
        ],
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
      createdAt: new Date(),
    },
    title: 'MongoDB聚合查询性能优化求助',
    content: {
      stage: 'tech',
      problem: '需要对百万级数据进行聚合查询，但是查询速度很慢，经常超时。',
      attempts: '已经添加了索引，但效果不明显。尝试过使用 $match 提前过滤，但还是很慢。',
    },
    attachments: [],
    status: 'resolved',
    mentions: ['教练阿北'],
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
          createdAt: new Date(),
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

const coachInfo = {
  name: '教练小夏',
  intro: '擅长增长策略与AIGC落地，专注冷启动与内容转化打法。',
};

const mockPostsV2: Post[] = mockPosts.map((post, index) => ({
  ...post,
  _id: `v2-${post._id}`,
  title: `${post.title}（第13期）`,
  status: index % 2 === 0 ? 'pending' : 'resolved',
  createdAt: new Date(Date.now() - (index + 1) * 3 * 60 * 60 * 1000),
  updatedAt: new Date(),
}));

const voyageOptions = [
  {
    id: 'v1',
    name: 'AI 航海',
    issue: '第12期',
    range: '2026.01.10 - 2026.02.10',
  },
  {
    id: 'v2',
    name: '增长航海',
    issue: '第13期',
    range: '2026.02.12 - 2026.03.12',
  },
];

const voyageData = {
  v1: {
    posts: mockPosts,
    questionLeaders: [
      { id: 'q1', name: 'V先生', questions: 5, resolved: 4, likes: 376 },
      { id: 'q2', name: '比高', questions: 1, resolved: 1, likes: 249 },
      { id: 'q3', name: '西昂', questions: 1, resolved: 1, likes: 161 },
      { id: 'q4', name: 'lydia', questions: 1, resolved: 1, likes: 151 },
      { id: 'q5', name: '小马宋', questions: 2, resolved: 1, likes: 138 },
    ],
    coachLeaders: [
      { id: 'c1', name: '教练小夏', answers: 32, adopted: 18, likes: 412 },
      { id: 'c2', name: '教练阿北', answers: 28, adopted: 15, likes: 366 },
      { id: 'c3', name: '教练Mia', answers: 23, adopted: 12, likes: 315 },
      { id: 'c4', name: '教练凯文', answers: 19, adopted: 9, likes: 288 },
      { id: 'c5', name: '教练Kira', answers: 16, adopted: 7, likes: 241 },
    ],
    user: {
      name: '当前用户',
      role: '船员',
      stats: { questions: 3, answers: 6, adopted: 2 },
      unresolved: 1,
    },
  },
  v2: {
    posts: mockPostsV2,
    questionLeaders: [
      { id: 'q1', name: '阿梨', questions: 4, resolved: 3, likes: 308 },
      { id: 'q2', name: '曦澄', questions: 2, resolved: 2, likes: 244 },
      { id: 'q3', name: '沈舟', questions: 2, resolved: 1, likes: 198 },
      { id: 'q4', name: '林晚', questions: 1, resolved: 1, likes: 155 },
      { id: 'q5', name: '青音', questions: 1, resolved: 1, likes: 130 },
    ],
    coachLeaders: [
      { id: 'c1', name: '教练Kira', answers: 26, adopted: 14, likes: 334 },
      { id: 'c2', name: '教练阿北', answers: 24, adopted: 12, likes: 312 },
      { id: 'c3', name: '教练小夏', answers: 20, adopted: 10, likes: 286 },
      { id: 'c4', name: '教练Mia', answers: 18, adopted: 9, likes: 254 },
      { id: 'c5', name: '教练凯文', answers: 15, adopted: 7, likes: 220 },
    ],
    user: {
      name: '当前用户',
      role: '船员',
      stats: { questions: 1, answers: 2, adopted: 0 },
      unresolved: 2,
    },
  },
} as const;

const leaderboardRanges = [
  { key: '7d', label: '近7天' },
  { key: '1m', label: '近1月' },
  { key: '3m', label: '近3月' },
  { key: '1y', label: '近1年' },
];

const communityCategories = [
  { key: 'all', label: '全部' },
  { key: 'tech', label: '技术问题' },
  { key: 'tool', label: '工具使用' },
  { key: 'process', label: '流程疑问' },
  { key: 'other', label: '其他' },
];

const aiQuickChips = ['部署', '数据库', '提示词', '工具使用'];

const suggestedCoaches = [
  { id: 'c1', name: '教练小夏', specialty: '增长策略' },
  { id: 'c2', name: '教练阿北', specialty: '技术架构' },
  { id: 'c3', name: '教练Mia', specialty: '产品增长' },
];

type AiMessage = {
  role: 'user' | 'ai';
  content: string;
};

type QuestionFormPrefill = {
  title?: string;
  content?: {
    stage?: string;
    problem?: string;
    attempts?: string;
  };
  mentions?: string[];
  includeAI?: boolean;
  allowReplies?: boolean;
  aiSummary?: string;
  aiHistory?: string;
};

export default function HomePage() {
  // 主Tab状态
  const [activeMainTab, setActiveMainTab] = useState<'log' | 'community'>('log');

  // 航海日志状态
  const [logStartDate, setLogStartDate] = useState<Date | null>(null);
  const [logEndDate, setLogEndDate] = useState<Date | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [extractedQAs, setExtractedQAs] = useState<QAKnowledge[]>([]); // 提取的真实数据
  const [selectedQA, setSelectedQA] = useState<QAKnowledge | null>(null); // 选中的QA用于显示详情
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false); // 详情弹窗状态
  const [allTags, setAllTags] = useState<string[]>([]); // 动态标签列表
  const [tagClickCounts, setTagClickCounts] = useState<Record<string, number>>({}); // 标签点击统计

  // 求助站状态
  const [communityTab, setCommunityTab] = useState<'all' | 'pending' | 'resolved'>('all');
  const [showForm, setShowForm] = useState(false);
  const [activeVoyageId, setActiveVoyageId] = useState<'v1' | 'v2'>('v1');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [questionLeaders, setQuestionLeaders] = useState(voyageData.v1.questionLeaders);
  const [coachLeaders, setCoachLeaders] = useState(voyageData.v1.coachLeaders);
  const [currentUser, setCurrentUser] = useState(voyageData.v1.user);
  const [communityStartDate, setCommunityStartDate] = useState<Date | null>(null);
  const [communityEndDate, setCommunityEndDate] = useState<Date | null>(null);
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('all');
  const [communityCoach, setCommunityCoach] = useState('all');
  const [communitySort, setCommunitySort] = useState<'latest' | 'hot'>('latest');
  const [leaderboardTab, setLeaderboardTab] = useState<'question' | 'coach'>('question');
  const [leaderboardRange, setLeaderboardRange] = useState('7d');
  const [showSearchSuggest, setShowSearchSuggest] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [showAiGuide, setShowAiGuide] = useState(false);
  const [skipAiGuide, setSkipAiGuide] = useState(false);
  const [formPrefill, setFormPrefill] = useState<QuestionFormPrefill | null>(null);

  // 页面加载时自动加载群聊提取的知识库
  useEffect(() => {
    loadExtractedQAs();
    loadTagClickCounts();
    const saved = localStorage.getItem('skipAiGuide');
    if (saved === 'true') {
      setSkipAiGuide(true);
    }
  }, []);

  useEffect(() => {
    const data = voyageData[activeVoyageId];
    setPosts(data.posts);
    setQuestionLeaders(data.questionLeaders);
    setCoachLeaders(data.coachLeaders);
    setCurrentUser(data.user);
    setCommunitySearch('');
    setCommunityTab('all');
    setCommunityCategory('all');
  }, [activeVoyageId]);

  // 加载标签点击统计（从localStorage）
  const loadTagClickCounts = () => {
    const saved = localStorage.getItem('tagClickCounts');
    if (saved) {
      setTagClickCounts(JSON.parse(saved));
    }
  };

  // 保存标签点击统计
  const saveTagClickCounts = (counts: Record<string, number>) => {
    localStorage.setItem('tagClickCounts', JSON.stringify(counts));
  };

  // 加载提取的知识库
  const loadExtractedQAs = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/qa/extracted');
      const result = await response.json();
      if (result.success) {
        setExtractedQAs(result.data);

        // 提取所有唯一标签
        const tags = new Set<string>();
        result.data.forEach((qa: QAKnowledge) => {
          qa.tags.forEach((tag: string) => tags.add(tag));
        });
        setAllTags(Array.from(tags));
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
    }
  };

  // 打开详情弹窗
  const handleCardClick = (qa: QAKnowledge) => {
    setSelectedQA(qa);
    setIsDetailModalOpen(true);
  };

  // 关闭详情弹窗
  const handleCloseDetail = () => {
    setIsDetailModalOpen(false);
    setSelectedQA(null);
  };

  // 航海日志筛选逻辑
  const filteredQAs = extractedQAs.filter((qa) => {
    // 日期筛选
    if (logStartDate && logEndDate) {
      const qaDate = new Date(qa.date);
      if (qaDate < logStartDate || qaDate > logEndDate) {
        return false;
      }
    }

    // 标签筛选
    if (selectedTags.length > 0) {
      const hasTag = selectedTags.some((tag) => qa.tags.includes(tag));
      if (!hasTag) return false;
    }

    // 关键词搜索
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const matchQuestion = qa.question.toLowerCase().includes(keyword);
      const matchAnswer = qa.answer.toLowerCase().includes(keyword);
      const matchTags = qa.tags.some((tag) => tag.toLowerCase().includes(keyword));
      if (!matchQuestion && !matchAnswer && !matchTags) {
        return false;
      }
    }

    return true;
  });

  // 求助站筛选逻辑
  const filteredPosts = posts.filter((post) => {
    // 状态筛选
    if (communityTab !== 'all' && post.status !== communityTab) {
      return false;
    }

    // 日期筛选
    if (communityStartDate && communityEndDate) {
      const postDate = new Date(post.createdAt);
      if (postDate < communityStartDate || postDate > communityEndDate) {
        return false;
      }
    }

    if (communityCategory !== 'all' && post.content.stage !== communityCategory) {
      return false;
    }

    if (communityCoach !== 'all') {
      const mentions = post.mentions || [];
      if (!mentions.includes(communityCoach)) {
        return false;
      }
    }

    if (communitySearch) {
      const keyword = communitySearch.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(keyword);
      const matchProblem = post.content.problem.toLowerCase().includes(keyword);
      const matchAttempts = post.content.attempts.toLowerCase().includes(keyword);
      if (!matchTitle && !matchProblem && !matchAttempts) {
        return false;
      }
    }

    return true;
  }).sort((a, b) => {
    if (communitySort === 'hot') {
      return (b.replies?.length || 0) - (a.replies?.length || 0);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const postCounts = {
    all: posts.length,
    pending: posts.filter((p) => p.status === 'pending').length,
    resolved: posts.filter((p) => p.status === 'resolved').length,
  };

  const similarPosts = communitySearch
    ? posts.filter((post) => post.title.toLowerCase().includes(communitySearch.toLowerCase()))
    : posts;

  const handleTagClick = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

    // 更新点击统计
    const newCounts = {
      ...tagClickCounts,
      [tag]: (tagClickCounts[tag] || 0) + 1,
    };
    setTagClickCounts(newCounts);
    saveTagClickCounts(newCounts);
  };

  // 清除所有标签筛选
  const handleClearAllTags = () => {
    setSelectedTags([]);
  };

  const handleFeedback = (qaId: string, type: 'useful' | 'useless') => {
    console.log(`Feedback for ${qaId}: ${type}`);
  };

  const handleSubmitPost = (data: CreatePostData) => {
    const now = new Date();
    const newPost: Post = {
      _id: `post-${Date.now()}`,
      authorId: '1',
      author: {
        _id: '1',
        nickname: '当前用户',
        avatar: '',
        role: 'member',
        stats: {
          questionsCount: 0,
          answersCount: 0,
          adoptedCount: 0,
        },
        createdAt: now,
      },
      title: data.title,
      content: data.content,
      attachments: data.attachments || [],
      status: 'pending',
      mentions: data.mentions || [],
      allowReplies: data.allowReplies,
      aiSummary: data.aiSummary,
      aiHistory: data.aiHistory,
      replies: [],
      viewCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    setPosts((prev) => [newPost, ...prev]);
    setShowForm(false);
    setFormPrefill(null);
  };

  const handleLogDateRangeChange = (start: Date | null, end: Date | null) => {
    setLogStartDate(start);
    setLogEndDate(end);
  };

  const handleCommunityDateRangeChange = (start: Date | null, end: Date | null) => {
    setCommunityStartDate(start);
    setCommunityEndDate(end);
  };

  const handleSearchFocus = () => {
    setShowSearchSuggest(true);
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchSuggest(false), 120);
  };

  const scrollToPost = (postId: string) => {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setShowSearchSuggest(false);
  };

  const openAiDrawer = () => {
    setAiOpen(true);
    if (communitySearch) {
      setAiInput(communitySearch);
    }
  };

  const closeAiDrawer = () => {
    setAiOpen(false);
  };

  const openHumanForm = (prefill?: QuestionFormPrefill) => {
    setFormPrefill(prefill || null);
    setShowForm(true);
  };

  const handleAskHumanClick = () => {
    if (!skipAiGuide) {
      setShowAiGuide(true);
      return;
    }
    openHumanForm();
  };

  const handleConfirmAskHuman = () => {
    localStorage.setItem('skipAiGuide', 'true');
    setSkipAiGuide(true);
    setShowAiGuide(false);
    openHumanForm();
  };

  const handleAiGuideAskAi = () => {
    setShowAiGuide(false);
    openAiDrawer();
  };

  const generateAiReply = (question: string) => {
    return `给你一个快速排查思路：\n\n1. 先确认是否为环境变量前缀导致前端读取不到。\n2. 如果是服务端接口，请检查部署环境是否有刷新。\n\n示例：\n\`\`\`bash\nNEXT_PUBLIC_API_BASE=https://example.com\n\`\`\`\n\n> 如仍有问题，可以贴出报错日志，我来帮你定位。`;
  };

  const renderAiContent = (content: string) => {
    const parts = content.split('```');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return (
          <pre key={`code-${index}`} className={styles.aiCode}>
            <code>{part.trim()}</code>
          </pre>
        );
      }

      return part.split('\n').map((line, lineIndex) => {
        if (!line) {
          return <div key={`space-${index}-${lineIndex}`} className={styles.aiSpacer} />;
        }
        if (line.startsWith('> ')) {
          return (
            <blockquote key={`quote-${index}-${lineIndex}`} className={styles.aiQuote}>
              {line.replace('> ', '')}
            </blockquote>
          );
        }
        return (
          <p key={`text-${index}-${lineIndex}`} className={styles.aiText}>
            {line}
          </p>
        );
      });
    });
  };

  const handleSendAi = () => {
    const text = aiInput.trim();
    if (!text) return;
    const nextMessages: AiMessage[] = [
      ...aiMessages,
      { role: 'user', content: text },
      { role: 'ai', content: generateAiReply(text) },
    ];
    setAiMessages(nextMessages);
    setAiInput('');
  };

  const handleAiChipClick = (chip: string) => {
    setAiInput(chip);
  };

  const handleAiToHuman = () => {
    const lastUser = [...aiMessages].reverse().find((msg) => msg.role === 'user');
    const lastAi = [...aiMessages].reverse().find((msg) => msg.role === 'ai');
    const question = lastUser?.content || communitySearch || '问题描述';
    const summary = lastAi?.content?.split('\n').slice(0, 4).join('\n') || '';
    const aiHistory = aiMessages
      .map((msg) => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`)
      .join('\n');

    const prefill: QuestionFormPrefill = {
      title: question.slice(0, 32),
      content: {
        stage: communityCategory !== 'all' ? communityCategory : '',
        problem: `${question}\n\nAI回答摘要：\n${summary}`,
        attempts: '',
      },
      includeAI: true,
      allowReplies: true,
      aiSummary: summary,
      aiHistory,
    };
    setAiOpen(false);
    openHumanForm(prefill);
  };

  const handleSelectCoachSuggest = (coachName: string) => {
    setShowSearchSuggest(false);
    openHumanForm({
      mentions: [coachName],
      allowReplies: true,
    });
  };

  const handleScrollLeaderboard = (tab: 'question' | 'coach') => {
    setLeaderboardTab(tab);
    const element = document.getElementById('community-leaderboard');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeVoyage = voyageOptions.find((voyage) => voyage.id === activeVoyageId);

  return (
    <div>
      <MainTabs activeTab={activeMainTab} onTabChange={setActiveMainTab} />

      {activeMainTab === 'log' ? (
        // 航海日志页面
        <div style={{ paddingTop: 'var(--spacing-6)' }}>
          {/* 智能标签栏 */}
          <SmartTagBar
            allTags={allTags}
            selectedTags={selectedTags}
            onTagClick={handleTagClick}
            onClearAll={handleClearAllTags}
            tagClickCounts={tagClickCounts}
          />

          {filteredQAs.length > 0 ? (
            <QAGrid>
              {filteredQAs.map((qa) => (
                <QACard
                  key={qa._id}
                  qa={qa}
                  onFeedback={handleFeedback}
                  onClick={() => handleCardClick(qa)}
                />
              ))}
            </QAGrid>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              暂无符合条件的知识内容
            </div>
          )}

          {/* 详情弹窗 */}
          {selectedQA && (
            <QADetailModal
              qa={selectedQA}
              isOpen={isDetailModalOpen}
              onClose={handleCloseDetail}
              onFeedback={handleFeedback}
            />
          )}
        </div>
      ) : (
        // 求助站页面
        <div className={styles.communityRoot}>
          <div className={styles.communityGrid}>
            <div className={styles.communityMain}>
              <div className={styles.communityHero}>
              <div className={styles.communityIntroCard}>
                <div className={styles.introIcon}>AI</div>
                <div className={styles.introContent}>
                  <div className={styles.introTitle}>求助站</div>
                  <div className={styles.introMeta}>562位提问者，共10000+个问题</div>
                  <div className={styles.introDesc}>
                    <span className={styles.introDescIcon}>✨</span>
                    欢迎来到求助站！这里汇聚航海伙伴与教练的实战解法，专注解决关键问题。
                  </div>
                </div>
                <div className={styles.introActions}>
                  <Button variant="primary" className={styles.aiPrimary} onClick={openAiDrawer}>
                    🤖 先问 AI 航海助手
                  </Button>
                  <Button
                    variant="outline"
                    className={styles.askSecondary}
                    onClick={handleAskHumanClick}
                  >
                    ✍️ 向教练/伙伴求助
                  </Button>
                </div>
              </div>
              <div className={styles.topActionCard}>
                <div className={styles.topRow}>
                  <div className={styles.searchBox}>
                    <span className={styles.searchIcon}>⌕</span>
                      <input
                        className={styles.searchInput}
                        placeholder="搜索历史问题 / 回答 / 教练关键词，例如：Next.js 环境变量"
                        value={communitySearch}
                        onChange={(e) => setCommunitySearch(e.target.value)}
                        onFocus={handleSearchFocus}
                        onBlur={handleSearchBlur}
                      />
                      {showSearchSuggest && communitySearch && (
                        <div className={styles.searchSuggest}>
                          <div className={styles.suggestGroup}>
                            <div className={styles.suggestTitle}>相似问题</div>
                            {similarPosts.slice(0, 3).map((post) => (
                              <button
                                key={post._id}
                                className={styles.suggestItem}
                                onClick={() => {
                                  setCommunitySearch(post.title);
                                  scrollToPost(post._id);
                                }}
                              >
                                <span>{post.title}</span>
                                {post.status === 'resolved' && (
                                  <span className={styles.suggestBadge}>已解决</span>
                                )}
                              </button>
                            ))}
                          </div>
                          <div className={styles.suggestGroup}>
                            <div className={styles.suggestTitle}>热门答案</div>
                            {posts
                              .flatMap((post) =>
                                (post.replies || []).map((reply) => ({
                                  id: reply._id,
                                  postId: post._id,
                                  content: reply.content,
                                }))
                              )
                              .slice(0, 3)
                              .map((reply) => (
                                <button
                                  key={reply.id}
                                  className={styles.suggestItem}
                                  onClick={() => scrollToPost(reply.postId)}
                                >
                                  {reply.content.slice(0, 36)}...
                                </button>
                              ))}
                          </div>
                          <div className={styles.suggestGroup}>
                            <div className={styles.suggestTitle}>推荐教练</div>
                            {suggestedCoaches.map((coach) => (
                              <button
                                key={coach.id}
                                className={styles.suggestItem}
                                onClick={() => handleSelectCoachSuggest(coach.name)}
                              >
                                <span>@{coach.name}</span>
                                <span className={styles.suggestMeta}>{coach.specialty}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <button className={styles.quickFilter}>快捷筛选</button>
                </div>

                <div className={styles.topRow}>
                  <div className={styles.hintText}>
                    推荐先问 AI，80% 常见问题可立即解决；未解决再向教练或伙伴发起求助。
                  </div>
                </div>

                </div>
              </div>

              <div className={styles.categoryRow}>
                {communityCategories.map((category) => (
                  <button
                    key={category.key}
                    className={`${styles.categoryPill} ${
                      communityCategory === category.key ? styles.categoryPillActive : ''
                    }`}
                    onClick={() => setCommunityCategory(category.key)}
                  >
                    {category.label}
                  </button>
                ))}
              </div>

              <div className={styles.filterRow}>
                <StatusTabs activeTab={communityTab} onTabChange={setCommunityTab} counts={postCounts} />
                <div className={styles.filterControls}>
                  <select
                    className={styles.filterSelect}
                    value={communityCoach}
                    onChange={(e) => setCommunityCoach(e.target.value)}
                  >
                    <option value="all">全部教练</option>
                    <option value="教练小夏">教练小夏</option>
                    <option value="教练阿北">教练阿北</option>
                    <option value="教练Mia">教练Mia</option>
                  </select>
                  <select
                    className={styles.filterSelect}
                    value={communitySort}
                    onChange={(e) => setCommunitySort(e.target.value as 'latest' | 'hot')}
                  >
                    <option value="latest">最新</option>
                    <option value="hot">最热</option>
                  </select>
                  <DateRangeFilter
                    startDate={communityStartDate || undefined}
                    endDate={communityEndDate || undefined}
                    onRangeChange={handleCommunityDateRangeChange}
                  />
                </div>
              </div>

              {filteredPosts.length > 0 ? (
                filteredPosts.map((post) => (
                  <div key={post._id} id={`post-${post._id}`}>
                    <PostCard post={post} onClick={() => console.log('View post:', post._id)} />
                  </div>
                ))
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                  暂无符合条件的帖子
                </div>
              )}
            </div>

            <aside className={styles.communitySidebar}>
              <div className={`${styles.sidebarCard} ${styles.userPanel}`}>
                <div className={styles.userCardHeader}>
                  <div className={styles.userAvatarLarge}>{currentUser.name.slice(0, 1)}</div>
                  <div>
                    <div className={styles.userName}>{currentUser.name}</div>
                    <span className={styles.userRoleBadge}>{currentUser.role}</span>
                  </div>
                </div>
                <button
                  className={styles.userAiFloat}
                  onClick={openAiDrawer}
                  aria-label="打开 AI 航海助手"
                >
                  <span className={styles.userAiHalo} />
                  <img src="/ai-robot.svg" alt="AI 航海助手" />
                </button>
                <div className={styles.voyageInfo}>
                  <div className={styles.voyageTitle}>{activeVoyage?.name}</div>
                  <div className={styles.voyageMeta}>
                    {activeVoyage?.issue} · {activeVoyage?.range}
                  </div>
                </div>
                <div className={styles.voyageSelectRow}>
                  <label>切换航海</label>
                  <select
                    className={styles.voyageSelect}
                    value={activeVoyageId}
                    onChange={(e) => setActiveVoyageId(e.target.value as 'v1' | 'v2')}
                  >
                    {voyageOptions.map((voyage) => (
                      <option key={voyage.id} value={voyage.id}>
                        {voyage.name} {voyage.issue}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.userStats}>
                  <div>
                    <span>提问</span>
                    <strong>{currentUser.stats.questions}</strong>
                  </div>
                  <div>
                    <span>回答</span>
                    <strong>{currentUser.stats.answers}</strong>
                  </div>
                  <div>
                    <span>被采纳</span>
                    <strong>{currentUser.stats.adopted}</strong>
                  </div>
                </div>
                <div className={styles.userQuickLinks}>
                  <button>我的提问</button>
                  <button>我的回答</button>
                  <button>我的收藏</button>
                </div>
                <div className={styles.unresolvedAlert}>
                  我还有 <strong>{currentUser.unresolved}</strong> 个问题未解决
                </div>
              </div>
              <div className={styles.sidebarCard}>
                <div className={styles.sidebarTitle}>本期航海教练</div>
                <div className={styles.coachCard}>
                  <div className={styles.coachRow}>
                    <div className={styles.coachAvatar}>{coachInfo.name.slice(0, 1)}</div>
                    <div className={styles.coachName}>{coachInfo.name}</div>
                  </div>
                  <div className={styles.coachIntro}>{coachInfo.intro}</div>
                </div>
              </div>

              <div className={styles.sidebarCard} id="community-leaderboard">
                <div className={styles.rankTabs}>
                  <button
                    className={`${styles.rankTab} ${
                      leaderboardTab === 'question' ? styles.rankTabActive : ''
                    }`}
                    onClick={() => setLeaderboardTab('question')}
                  >
                    船员提问榜
                  </button>
                  <button
                    className={`${styles.rankTab} ${
                      leaderboardTab === 'coach' ? styles.rankTabActive : ''
                    }`}
                    onClick={() => setLeaderboardTab('coach')}
                  >
                    教练回答榜
                  </button>
                </div>

                <div className={styles.rankRanges}>
                  {leaderboardRanges.map((range) => (
                    <button
                      key={range.key}
                      className={`${styles.rankRange} ${
                        leaderboardRange === range.key ? styles.rankRangeActive : ''
                      }`}
                      onClick={() => setLeaderboardRange(range.key)}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                <div className={styles.rankList}>
                  {(leaderboardTab === 'question' ? questionLeaders : coachLeaders).map(
                    (leader, index) => (
                      <div key={leader.id} className={styles.rankItem}>
                        <span className={`${styles.rankIcon} ${styles[`rank${index + 1}`] || ''}`}>
                          {index + 1}
                        </span>
                        <div className={styles.rankAvatar}>{leader.name.slice(0, 1)}</div>
                        <div className={styles.rankInfo}>
                          <div className={styles.rankName}>{leader.name}</div>
                          <div className={styles.rankMeta}>
                            {leaderboardTab === 'question'
                              ? `提问 ${(leader as typeof questionLeaders[number]).questions} · 已解决 ${
                                  (leader as typeof questionLeaders[number]).resolved
                                } · 获赞 ${(leader as typeof questionLeaders[number]).likes}`
                              : `回答 ${(leader as typeof coachLeaders[number]).answers} · 被采纳 ${
                                  (leader as typeof coachLeaders[number]).adopted
                                } · 获赞 ${(leader as typeof coachLeaders[number]).likes}`}
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>

                <button className={styles.rankMore}>查看更多</button>
              </div>
            </aside>
          </div>

          {showForm && (
            <div className={styles.modalBackdrop} onClick={() => setShowForm(false)}>
              <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
                <QuestionForm
                  onSubmit={handleSubmitPost}
                  onCancel={() => setShowForm(false)}
                  initialData={formPrefill || undefined}
                />
              </div>
            </div>
          )}

          {showAiGuide && (
            <div className={styles.modalBackdrop} onClick={() => setShowAiGuide(false)}>
              <div className={styles.guideCard} onClick={(e) => e.stopPropagation()}>
                <div className={styles.guideTitle}>建议先问 AI 航海助手</div>
                <div className={styles.guideText}>
                  推荐先问 AI，80% 常见问题可即时解决；如未解决再向教练与伙伴求助。
                </div>
                <div className={styles.guideActions}>
                  <Button variant="primary" onClick={handleAiGuideAskAi}>
                    先问 AI
                  </Button>
                  <Button variant="outline" onClick={handleConfirmAskHuman}>
                    继续求助
                  </Button>
                </div>
              </div>
            </div>
          )}

          {aiOpen && (
            <div className={styles.aiDrawerBackdrop} onClick={closeAiDrawer}>
              <div className={styles.aiDrawer} onClick={(e) => e.stopPropagation()}>
                <div className={styles.aiHeader}>
                  <div>
                    <div className={styles.aiTitle}>AI 航海助手</div>
                    <div className={styles.aiSubtitle}>先问 AI，快速定位问题方向</div>
                  </div>
                  <button className={styles.aiClose} onClick={closeAiDrawer}>
                    ✕
                  </button>
                </div>

                <div className={styles.aiChipRow}>
                  {aiQuickChips.map((chip) => (
                    <button key={chip} onClick={() => handleAiChipClick(chip)}>
                      {chip}
                    </button>
                  ))}
                </div>

                <div className={styles.aiBody}>
                  {aiMessages.length === 0 && (
                    <div className={styles.aiEmpty}>
                      可以直接描述你的问题，AI 会先给出排查方向与参考方案。
                    </div>
                  )}
                  {aiMessages.map((msg, index) => (
                    <div
                      key={`${msg.role}-${index}`}
                      className={`${styles.aiMessage} ${styles[`ai${msg.role}`]}`}
                    >
                      <div className={styles.aiBubble}>{renderAiContent(msg.content)}</div>
                    </div>
                  ))}
                </div>

                <div className={styles.aiInputRow}>
                  <input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="输入你的问题，AI 先帮你排查"
                  />
                  <button onClick={handleSendAi}>发送</button>
                </div>

                <div className={styles.aiFooter}>
                  <div className={styles.aiFooterHint}>没解决？</div>
                  <button className={styles.aiToHuman} onClick={handleAiToHuman}>
                    一键转人工求助 →
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
