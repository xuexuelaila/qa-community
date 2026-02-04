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
      createdAt: new Date(),
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
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [communityStartDate, setCommunityStartDate] = useState<Date | null>(null);
  const [communityEndDate, setCommunityEndDate] = useState<Date | null>(null);

  // 页面加载时自动加载群聊提取的知识库
  useEffect(() => {
    loadExtractedQAs();
    loadTagClickCounts();
  }, []);

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

    return true;
  });

  const postCounts = {
    all: posts.length,
    pending: posts.filter((p) => p.status === 'pending').length,
    resolved: posts.filter((p) => p.status === 'resolved').length,
  };

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
    console.log('Submit post:', data);
    setShowForm(false);
  };

  const handleLogDateRangeChange = (start: Date | null, end: Date | null) => {
    setLogStartDate(start);
    setLogEndDate(end);
  };

  const handleCommunityDateRangeChange = (start: Date | null, end: Date | null) => {
    setCommunityStartDate(start);
    setCommunityEndDate(end);
  };

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
        <div>
          <StatusTabs activeTab={communityTab} onTabChange={setCommunityTab} counts={postCounts} />

          <DateRangeFilter
            startDate={communityStartDate || undefined}
            endDate={communityEndDate || undefined}
            onRangeChange={handleCommunityDateRangeChange}
          />

          <div style={{ padding: '16px' }}>
            {!showForm && (
              <Button variant="primary" fullWidth onClick={() => setShowForm(true)}>
                + 发起求助
              </Button>
            )}
          </div>

          {showForm && (
            <QuestionForm onSubmit={handleSubmitPost} onCancel={() => setShowForm(false)} />
          )}

          <div>
            {filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard
                  key={post._id}
                  post={post}
                  onClick={() => console.log('View post:', post._id)}
                />
              ))
            ) : (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
                暂无符合条件的帖子
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
