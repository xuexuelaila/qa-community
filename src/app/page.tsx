'use client';

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import ContentModeSwitch from '@/components/common/ContentModeSwitch';
import DateRangePicker from '@/components/common/DateRangePicker';
import SmartTagBar from '@/components/log/SmartTagBar';
import QAGrid from '@/components/log/QAGrid';
import QACard from '@/components/log/QACard';
import QADetailModal from '@/components/log/QADetailModal';
import StatusTabs from '@/components/community/StatusTabs';
import PostCard from '@/components/community/PostCard';
import DateRangeFilter from '@/components/common/DateRangeFilter';
import Button from '@/components/common/Button';
import { QAKnowledge } from '@/types/qa';
import { Post, CreatePostData } from '@/types/post';
import styles from './page.module.css';

const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

type QuestionLeader = {
  id: string;
  name: string;
  questions: number;
  resolved: number;
  likes: number;
};

type CoachLeader = {
  id: string;
  name: string;
  answers: number;
  adopted: number;
  likes: number;
};

type VoyageUser = {
  name: string;
  role: string;
  stats: { questions: number; answers: number; adopted: number };
  unresolved: number;
};

type VoyageData = {
  posts: Post[];
  questionLeaders: QuestionLeader[];
  coachLeaders: CoachLeader[];
  user: VoyageUser;
};

const voyageData: Record<'v1' | 'v2', VoyageData> = {
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
};

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

const categoryLabelMap = communityCategories.reduce<Record<string, string>>((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

const coachShowcase = [
  {
    id: 'c1',
    name: '教练小夏',
    specialty: '增长策略',
    responseTime: '平均 4 小时内回复',
  },
  {
    id: 'c2',
    name: '教练阿北',
    specialty: '技术部署',
    responseTime: '平均 6 小时内回复',
  },
  {
    id: 'c3',
    name: '教练Mia',
    specialty: 'AIGC 应用',
    responseTime: '平均 8 小时内回复',
  },
];

type AiMessage = {
  role: 'user' | 'ai';
  content: string;
};

type MyCenterTab = 'question' | 'answer' | 'favorite';
type MyCenterItem = {
  id: string;
  tab: MyCenterTab;
  title: string;
  category: string;
  voyage: string;
  time: Date;
  status?: 'pending' | 'resolved';
  mentionsCoach?: boolean;
  allowCrew?: boolean;
  adopted?: boolean;
  likes?: number;
  origin?: 'faq' | 'community';
  source?: 'ai' | 'coach' | 'member';
  postId?: string;
};

type CoachPrefill = {
  title?: string;
  description?: string;
  aiSummary?: string;
  aiHistory?: string;
  hasAIContext?: boolean;
};

type AttachmentStatus = 'uploading' | 'success' | 'failed';

type AttachmentItem = {
  id: string;
  file: File;
  kind: 'image' | 'video';
  status: AttachmentStatus;
  progress: number;
  previewUrl: string;
  error?: string;
};

const renderTextWithLinks = (text: string) => {
  const parts = text.split(/(https?:\/\/[^\s]+)/g);
  return parts.map((part, index) => {
    if (/^https?:\/\//.test(part)) {
      return (
        <a key={`link-${index}`} href={part} target="_blank" rel="noreferrer">
          {part}
        </a>
      );
    }
    return part;
  });
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
          {renderTextWithLinks(line)}
        </p>
      );
    });
  });
};

const AskCoachModalHeader = ({
  coach,
  onClose,
}: {
  coach: typeof coachShowcase[number];
  onClose: () => void;
}) => (
  <div className={styles.askHeader}>
    <div className={styles.askHeaderLeft}>
      <div className={styles.askCoachAvatar}>{coach.name.slice(0, 1)}</div>
      <div>
        <div className={styles.askCoachNameRow}>
          <span className={styles.askCoachName}>{coach.name}</span>
          <span className={styles.askCoachBadge}>教练</span>
          <span className={styles.askCoachStatusDot} title="在线" />
        </div>
        <div className={styles.askCoachMeta}>
          擅长：{coach.specialty} · {coach.responseTime}
        </div>
      </div>
    </div>
    <button className={styles.askClose} onClick={onClose} aria-label="关闭">
      ✕
    </button>
  </div>
);

const AskAIInlineHint = ({ onOpenAI }: { onOpenAI: () => void }) => (
  <button type="button" className={styles.askAiHint} onClick={onOpenAI}>
    先问 AI 航海助手试试 →
  </button>
);

const QuestionTitleField = ({
  value,
  onChange,
  error,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  max: number;
}) => (
  <label className={styles.askField}>
    问题标题
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="用一句话描述问题"
      maxLength={max}
    />
    <div className={styles.askFieldMeta}>
      {error ? <span className={styles.askError}>{error}</span> : <span />}
      <span className={styles.askCount}>
        {value.length}/{max}
      </span>
    </div>
  </label>
);

const QuestionDescriptionField = ({
  value,
  onChange,
  error,
  max,
}: {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  max: number;
}) => (
  <label className={styles.askField}>
    问题描述
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="背景/现象/尝试/期望（支持 Markdown/代码块）"
      maxLength={max}
    />
    <div className={styles.askFieldMeta}>
      {error ? <span className={styles.askError}>{error}</span> : <span />}
      <span className={styles.askCount}>
        {value.length}/{max}
      </span>
    </div>
  </label>
);

const AskCoachForm = ({
  title,
  description,
  onTitleChange,
  onDescriptionChange,
  titleError,
  descError,
  onOpenAI,
}: {
  title: string;
  description: string;
  onTitleChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  titleError?: string;
  descError?: string;
  onOpenAI: () => void;
}) => (
  <div className={styles.askForm}>
    <QuestionTitleField value={title} onChange={onTitleChange} error={titleError} max={60} />
    <QuestionDescriptionField
      value={description}
      onChange={onDescriptionChange}
      error={descError}
      max={1200}
    />
    <AskAIInlineHint onOpenAI={onOpenAI} />
  </div>
);

const SettingToggleItem = ({
  label,
  desc,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}) => (
  <div className={styles.settingItem}>
    <div>
      <div className={styles.settingLabel}>{label}</div>
      <div className={styles.settingDesc}>{desc}</div>
    </div>
    <label className={styles.settingToggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <span />
    </label>
  </div>
);

const AskCoachSettings = ({
  allowCrewAnswer,
  attachAIContext,
  onAllowChange,
  onAttachChange,
  hasAIContext,
}: {
  allowCrewAnswer: boolean;
  attachAIContext: boolean;
  onAllowChange: (value: boolean) => void;
  onAttachChange: (value: boolean) => void;
  hasAIContext: boolean;
}) => (
  <div className={styles.askSettings}>
    <SettingToggleItem
      label="允许船员回答"
      desc="开启后，其他船员也可参与回答"
      checked={allowCrewAnswer}
      onChange={onAllowChange}
    />
    {hasAIContext && (
      <SettingToggleItem
        label="附带 AI 回答记录"
        desc="帮助教练快速理解上下文"
        checked={attachAIContext}
        onChange={onAttachChange}
      />
    )}
  </div>
);

const AskCoachModalFooter = ({
  onCancel,
  onSubmit,
  canSubmit,
  submitting,
  primaryLabel = '提交给教练',
  secondaryLabel = '取消',
}: {
  onCancel: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  submitting: boolean;
  primaryLabel?: string;
  secondaryLabel?: string;
}) => (
  <div className={styles.askFooter}>
    <button className={styles.askCancel} onClick={onCancel}>
      {secondaryLabel}
    </button>
    <button
      className={styles.askSubmit}
      onClick={onSubmit}
      disabled={!canSubmit || submitting}
    >
      {submitting ? '提交中…' : primaryLabel}
    </button>
  </div>
);

const AskCoachModal = ({
  open,
  coach,
  prefill,
  onClose,
  onSubmitted,
  aiMessages,
  aiInputValue,
  onAiInput,
  onSendAi,
  aiStatusLabel,
  onAttachAI,
}: {
  open: boolean;
  coach: typeof coachShowcase[number];
  prefill: CoachPrefill;
  onClose: () => void;
  onSubmitted: (data: {
    title: string;
    description: string;
    allowCrewAnswer: boolean;
    attachAIContext: boolean;
    aiSummary?: string;
    aiHistory?: string;
    attachments?: { type: 'image' | 'video'; url: string }[];
  }) => void;
  aiMessages: AiMessage[];
  aiInputValue: string;
  onAiInput: (value: string) => void;
  onSendAi: () => void;
  aiStatusLabel: string;
  onAttachAI: (summary: string, history: string) => void;
}) => {
  const [mode, setMode] = useState<'coach' | 'ai'>('coach');
  const [title, setTitle] = useState(prefill.title ?? '');
  const [description, setDescription] = useState(prefill.description ?? '');
  const [allowCrewAnswer, setAllowCrewAnswer] = useState(true);
  const [attachAIContext, setAttachAIContext] = useState(Boolean(prefill.hasAIContext));
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewItem, setPreviewItem] = useState<AttachmentItem | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [attachmentError, setAttachmentError] = useState('');
  const uploadTimers = React.useRef<Record<string, number>>({});
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const attachmentsRef = React.useRef<AttachmentItem[]>([]);
  const committedUrlsRef = React.useRef<Set<string>>(new Set());

  const hasUploading = attachments.some((item) => item.status === 'uploading');

  useEffect(() => {
    if (open) {
      setTitle(prefill.title ?? '');
      setDescription(prefill.description ?? '');
      setAttachAIContext(Boolean(prefill.hasAIContext));
      setAllowCrewAnswer(true);
      setErrors({});
      setMode('coach');
      if (attachmentsRef.current.length > 0) {
        attachmentsRef.current.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        Object.values(uploadTimers.current).forEach((timerId) => window.clearInterval(timerId));
        uploadTimers.current = {};
      }
      setAttachments([]);
      setAttachmentError('');
      setPreviewItem(null);
    }
  }, [open, prefill]);

  useEffect(() => {
    if (!previewItem) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewItem(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewItem]);

  const canSubmit = Boolean(title.trim()) && Boolean(description.trim());

  useEffect(() => {
    attachmentsRef.current = attachments;
  }, [attachments]);

  useEffect(() => {
    return () => {
      Object.values(uploadTimers.current).forEach((timerId) => window.clearInterval(timerId));
      attachmentsRef.current.forEach((item) => {
        if (!committedUrlsRef.current.has(item.previewUrl)) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const startUpload = (id: string) => {
    if (uploadTimers.current[id]) {
      window.clearInterval(uploadTimers.current[id]);
    }
    uploadTimers.current[id] = window.setInterval(() => {
      setAttachments((prev) =>
        prev.map((item) => {
          if (item.id !== id) return item;
          const next = Math.min(100, item.progress + Math.random() * 18 + 8);
          if (next >= 100) {
            window.clearInterval(uploadTimers.current[id]);
            return { ...item, progress: 100, status: 'success' };
          }
          return { ...item, progress: next };
        })
      );
    }, 260);
  };

  const appendFiles = (files: File[]) => {
    if (!files.length) return;
    setAttachmentError('');
    const nextItems: AttachmentItem[] = [];
    const existingImages = attachments.filter((item) => item.kind === 'image').length;
    const existingVideos = attachments.filter((item) => item.kind === 'video').length;
    let imagesCount = existingImages;
    let videosCount = existingVideos;
    files.forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      if (!isImage && !isVideo) {
        setAttachmentError('仅支持上传图片或视频文件');
        return;
      }
      if (isImage && imagesCount >= 9) {
        setAttachmentError('图片最多上传 9 张');
        return;
      }
      if (isVideo && videosCount >= 2) {
        setAttachmentError('视频最多上传 2 个');
        return;
      }
      const maxSize = isImage ? 10 * 1024 * 1024 : 100 * 1024 * 1024;
      let previewUrl = '';
      try {
        previewUrl = URL.createObjectURL(file);
      } catch (error) {
        setAttachmentError('文件处理失败，请重试');
        return;
      }
      const item: AttachmentItem = {
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        file,
        kind: isImage ? 'image' : 'video',
        status: file.size > maxSize ? 'failed' : 'uploading',
        progress: file.size > maxSize ? 0 : 5,
        previewUrl,
        error: file.size > maxSize ? '文件过大' : undefined,
      };
      nextItems.push(item);
      if (isImage) imagesCount += 1;
      if (isVideo) videosCount += 1;
    });
    if (!nextItems.length) return;
    setAttachments((prev) => [...prev, ...nextItems]);
    nextItems.forEach((item) => {
      if (item.status === 'uploading') startUpload(item.id);
    });
  };

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    appendFiles(Array.from(fileList));
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => {
      const item = prev.find((entry) => entry.id === id);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        committedUrlsRef.current.delete(item.previewUrl);
        if (uploadTimers.current[id]) {
          window.clearInterval(uploadTimers.current[id]);
        }
      }
      return prev.filter((entry) => entry.id !== id);
    });
  };

  const handleRetry = (id: string) => {
    setAttachments((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, status: 'uploading', progress: 8, error: undefined } : item
      )
    );
    startUpload(id);
  };

  const handleClearAll = () => {
    attachments.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    Object.values(uploadTimers.current).forEach((timerId) => window.clearInterval(timerId));
    uploadTimers.current = {};
    setAttachments([]);
  };

  const maybeAppendAiSummary = () => {
    const summary = prefill.aiSummary || '';
    const history = prefill.aiHistory || '';
    if (summary && !description.includes('AI回答摘要')) {
      setDescription((prev) => `${prev.trim()}\n\nAI回答摘要：\n${summary}`.trim());
    }
    onAttachAI(summary, history);
    setAttachAIContext(true);
  };

  const handleSubmit = async () => {
    const nextErrors: { title?: string; description?: string } = {};
    if (!title.trim()) nextErrors.title = '请填写标题';
    if (!description.trim()) nextErrors.description = '请填写描述';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (hasUploading) return;
    setSubmitting(true);
    const submittedAttachments = attachments
      .filter((item) => item.status === 'success')
      .map((item) => ({
        type: item.kind,
        url: item.previewUrl,
      }));
    submittedAttachments.forEach((item) => committedUrlsRef.current.add(item.url));
    await Promise.resolve(
      onSubmitted({
        title,
        description,
        allowCrewAnswer,
        attachAIContext,
        aiSummary: prefill.aiSummary,
        aiHistory: prefill.aiHistory,
        attachments: submittedAttachments,
      })
    );
    setSubmitting(false);
  };

  if (!open) return null;

  const handleClose = () => {
    const hasDraft =
      Boolean(title.trim()) ||
      Boolean(description.trim()) ||
      attachments.length > 0 ||
      hasUploading;
    if (hasDraft) {
      const confirmed = window.confirm('当前有未提交内容，确认关闭？');
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={handleClose}>
      <div
        className={`${styles.askModal} ${styles[`askModal${mode}`]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {mode === 'coach' ? (
          <>
            <AskCoachModalHeader coach={coach} onClose={handleClose} />
            <div className={styles.askContent}>
              <AskCoachForm
                title={title}
                description={description}
                onTitleChange={setTitle}
                onDescriptionChange={setDescription}
                titleError={errors.title}
                descError={errors.description}
                onOpenAI={() => setMode('ai')}
              />
              <div className={styles.attachmentSection}>
                <div className={styles.attachmentHeader}>
                  <div>
                    <div className={styles.attachmentTitle}>附件</div>
                    <div className={styles.attachmentMeta}>
                      图片 jpg/png/webp ≤10MB · 最多 9 张，视频 mp4/mov ≤100MB · 最多 2 个
                    </div>
                  </div>
                  {attachments.length > 0 && (
                    <button className={styles.attachmentClear} onClick={handleClearAll}>
                      清空
                    </button>
                  )}
                </div>
                <div
                  className={`${styles.attachmentDrop} ${isDragging ? styles.attachmentDropActive : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFiles(e.dataTransfer.files);
                  }}
                >
                  <label className={styles.attachmentButton}>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/png,image/jpeg,image/webp,video/mp4,video/quicktime"
                      onChange={(e) => {
                        handleFiles(e.target.files);
                        e.currentTarget.value = '';
                      }}
                    />
                    上传图片/视频
                  </label>
                  <span>或拖拽到此处</span>
                </div>
                {attachmentError && (
                  <div className={styles.attachmentErrorText}>{attachmentError}</div>
                )}
                {attachments.length > 0 && (
                  <div className={styles.attachmentGrid}>
                    {attachments.map((item) => (
                      <div key={item.id} className={styles.attachmentTile}>
                        <button
                          className={styles.attachmentPreview}
                          onClick={() => setPreviewItem(item)}
                          type="button"
                        >
                          {item.kind === 'image' ? (
                            <img src={item.previewUrl} alt="附件预览" />
                          ) : (
                            <>
                              <video src={item.previewUrl} muted playsInline />
                              <span className={styles.attachmentPlay}>▶</span>
                            </>
                          )}
                        </button>
                        {item.status === 'uploading' && (
                          <div className={styles.attachmentProgress}>
                            <span style={{ width: `${item.progress}%` }} />
                          </div>
                        )}
                        {item.status === 'failed' && (
                          <button
                            className={styles.attachmentRetry}
                            onClick={() => handleRetry(item.id)}
                          >
                            上传失败 · 点击重试
                          </button>
                        )}
                        <button
                          className={styles.attachmentRemoveIcon}
                          onClick={() => handleRemoveAttachment(item.id)}
                          aria-label="删除附件"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <AskCoachSettings
                allowCrewAnswer={allowCrewAnswer}
                attachAIContext={attachAIContext}
                onAllowChange={setAllowCrewAnswer}
                onAttachChange={setAttachAIContext}
                hasAIContext={Boolean(prefill.hasAIContext)}
              />
            </div>
              {previewItem && (
                <div
                  className={styles.previewBackdrop}
                  onClick={() => setPreviewItem(null)}
                  role="dialog"
                  aria-modal="true"
                >
                  <div className={styles.previewBody} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.previewClose}
                      onClick={() => setPreviewItem(null)}
                      aria-label="关闭预览"
                    >
                      ✕
                    </button>
                    {previewItem.kind === 'image' ? (
                      <img src={previewItem.previewUrl} alt={previewItem.file.name} />
                    ) : (
                      <video src={previewItem.previewUrl} controls />
                    )}
                  </div>
                </div>
              )}
            <AskCoachModalFooter
              onCancel={handleClose}
              onSubmit={handleSubmit}
              canSubmit={canSubmit && !hasUploading}
              submitting={submitting}
            />
          </>
        ) : (
          <>
            <div className={styles.askContent}>
              <div className={styles.aiModeHeader}>
                <button className={styles.aiBack} onClick={() => setMode('coach')}>
                  ← 返回向教练提问
                </button>
                <div className={styles.aiModeTitleRow}>
                  <img className={styles.aiModeAvatar} src="/ai-robot.png" alt="AI 航海助手" />
                  <div>
                    <div className={styles.aiModeTitle}>AI 航海助手</div>
                    <div className={styles.aiModeStatus}>{aiStatusLabel}</div>
                  </div>
                </div>
              </div>
              <div className={styles.aiModeBody}>
                {aiMessages.length === 0 && (
                  <div className={styles.aiEmpty}>
                    直接描述你的问题，AI 会先给出排查方向与参考方案。
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
                  value={aiInputValue}
                  onChange={(e) => onAiInput(e.target.value)}
                  placeholder="直接向 AI 提问，立即获得解答"
                />
                <button onClick={onSendAi}>发送</button>
              </div>
              <div className={styles.aiModeHint}>
                推荐先问 AI，80% 常见问题可即时解决；未解决再向教练提问
              </div>
            </div>
            <AskCoachModalFooter
              onCancel={handleClose}
              onSubmit={() => {
                maybeAppendAiSummary();
                setMode('coach');
              }}
              canSubmit
              submitting={false}
              primaryLabel="没解决？转向教练提问"
              secondaryLabel="关闭"
            />
          </>
        )}
      </div>
    </div>
  );
};

export default function HomePage() {
  const safeSessionGet = (key: string) => {
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  const safeSessionSet = (key: string, value: string) => {
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  };

  const safeLocalGet = (key: string) => {
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      return null;
    }
  };

  const safeLocalSet = (key: string, value: string) => {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      return;
    }
  };
  // 主Tab状态
  const [activeMainTab, setActiveMainTab] = useState<'log' | 'community'>('log');
  useEffect(() => {
    const saved = safeLocalGet('contentMode');
    if (saved === 'log' || saved === 'community') {
      setActiveMainTab(saved);
    }
  }, []);
  useEffect(() => {
    safeLocalSet('contentMode', activeMainTab);
  }, [activeMainTab]);

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
  const [activeVoyageId, setActiveVoyageId] = useState<'v1' | 'v2'>('v1');
  const [posts, setPosts] = useState<Post[]>(mockPosts);
  const [questionLeaders, setQuestionLeaders] = useState<QuestionLeader[]>(
    voyageData.v1.questionLeaders
  );
  const [coachLeaders, setCoachLeaders] = useState<CoachLeader[]>(voyageData.v1.coachLeaders);
  const [currentUser, setCurrentUser] = useState<VoyageUser>(voyageData.v1.user);
  const [communityStartDate, setCommunityStartDate] = useState<Date | null>(null);
  const [communityEndDate, setCommunityEndDate] = useState<Date | null>(null);
  const [communitySearch, setCommunitySearch] = useState('');
  const [communityCategory, setCommunityCategory] = useState('all');
  const [communityCoach, setCommunityCoach] = useState('all');
  const [communitySort, setCommunitySort] = useState<'latest' | 'hot'>('latest');
  const [leaderboardTab, setLeaderboardTab] = useState<'question' | 'coach'>('question');
  const [leaderboardRange, setLeaderboardRange] = useState('7d');
  const [coachModalOpen, setCoachModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiStatus, setAiStatus] = useState<'available' | 'thinking' | 'online'>('available');
  const [showRobot, setShowRobot] = useState(true);
  const [showRobotTip, setShowRobotTip] = useState(false);
  const [isRobotCollapsed, setIsRobotCollapsed] = useState(false);
  const [isRobotHover, setIsRobotHover] = useState(false);
  const [robotPos, setRobotPos] = useState<{ x: number; y: number } | null>(null);
  const [robotDragged, setRobotDragged] = useState(false);
  const [playRobotIntro, setPlayRobotIntro] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [voyageSwitchOpen, setVoyageSwitchOpen] = useState(false);
  const [showReminder, setShowReminder] = useState(true);
  const hoverCollapseTimer = React.useRef<number | null>(null);
  const robotPosRef = React.useRef<{ x: number; y: number } | null>(null);
  const dragDataRef = React.useRef<{
    offsetX: number;
    offsetY: number;
    startX: number;
    startY: number;
  } | null>(null);
  const dragMovedRef = React.useRef(false);
  const userPanelRef = React.useRef<HTMLDivElement | null>(null);
  const robotRef = React.useRef<HTMLButtonElement | null>(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiHistory, setAiHistory] = useState('');
  const [coachPrefill, setCoachPrefill] = useState<CoachPrefill>({
    title: '',
    description: '',
    hasAIContext: false,
  });
  const [selectedCoach, setSelectedCoach] = useState(coachShowcase[0]);
  const aiInputRef = React.useRef<HTMLInputElement | null>(null);
  const [myCenterOpen, setMyCenterOpen] = useState(false);
  const [myCenterTab, setMyCenterTab] = useState<MyCenterTab>('question');
  const [myCenterSearch, setMyCenterSearch] = useState('');
  const [myCenterFiltersOpen, setMyCenterFiltersOpen] = useState(false);
  const [myDetailItem, setMyDetailItem] = useState<MyCenterItem | null>(null);
  const [myFilters, setMyFilters] = useState({
    time: 'all',
    voyage: 'all',
    category: 'all',
    sort: 'latest',
    status: 'all',
    mention: 'all',
    allowCrew: 'all',
    adopted: 'all',
    like: 'all',
    favType: 'all',
    source: 'all',
  });

  // 页面加载时自动加载群聊提取的知识库
  useEffect(() => {
    loadExtractedQAs();
    loadTagClickCounts();
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
    setVoyageSwitchOpen(false);
    setShowReminder(true);
  }, [activeVoyageId]);

  useEffect(() => {
    if (aiModalOpen) {
      setTimeout(() => aiInputRef.current?.focus(), 0);
    }
  }, [aiModalOpen]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const handleScroll = () => {
      setIsRobotCollapsed(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    robotPosRef.current = robotPos;
  }, [robotPos]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    const seenKey = 'aiRobotSeen';
    const seen = safeSessionGet(seenKey);
    if (seen) return undefined;
    setShowRobot(false);
    const showTimer = window.setTimeout(() => {
      setShowRobot(true);
      setShowRobotTip(true);
      setPlayRobotIntro(true);
      safeSessionSet(seenKey, '1');
    }, 800);
    const tipTimer = window.setTimeout(() => {
      setShowRobotTip(false);
    }, 2800);
    const introTimer = window.setTimeout(() => {
      setPlayRobotIntro(false);
    }, 1800);
    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(tipTimer);
      window.clearTimeout(introTimer);
      if (hoverCollapseTimer.current) {
        window.clearTimeout(hoverCollapseTimer.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    let rafId = 0;
    const getRightOverlay = () => {
      const selectors = [
        '[data-drawer="right"]',
        '[data-overlay="right"]',
        '.drawer-right',
        '.right-drawer',
        '.side-drawer.right',
        '.ant-drawer-right',
      ];
      for (const sel of selectors) {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        if (rect.width > 260 && rect.right >= window.innerWidth - 4) {
          return rect;
        }
      }
      return null;
    };

    const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

    const updatePosition = () => {
      if (robotDragged) return;
      const panelRect = userPanelRef.current?.getBoundingClientRect();
      const robotRect = robotRef.current?.getBoundingClientRect();
      const width = robotRect?.width ?? 96;
      const height = robotRect?.height ?? 140;
      const baseSide = Math.max(24, (window.innerWidth - 1200) / 2 + 24);
      let x = panelRect ? panelRect.right + 12 : window.innerWidth - width - baseSide;
      let y = panelRect ? panelRect.top + 12 : 140;
      const overlay = getRightOverlay();
      if (overlay && x + width > overlay.left - 12) {
        x = overlay.left - width - 12;
      }
      x = clamp(x, baseSide, window.innerWidth - width - baseSide);
      y = clamp(y, 80, window.innerHeight - height - 24);
      const footer =
        document.querySelector('footer') ||
        document.getElementById('footer') ||
        document.querySelector('[data-footer]');
      if (footer) {
        const rect = (footer as HTMLElement).getBoundingClientRect();
        if (rect.top < window.innerHeight) {
          const maxY = rect.top - height - 16;
          y = clamp(y, 80, maxY);
        }
      }
      setRobotPos({ x, y });
    };

    const scheduleUpdate = () => {
      if (rafId) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        updatePosition();
      });
    };

    const observer = new MutationObserver(scheduleUpdate);
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    scheduleUpdate();

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [robotDragged, isRobotCollapsed, activeMainTab]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = safeLocalGet('aiRobotPos');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { x: number; y: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          setRobotPos(parsed);
          setRobotDragged(true);
        }
      } catch (error) {
        console.warn('读取机器人位置失败', error);
      }
    }
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
    const normalizeQa = (qa: any): QAKnowledge | null => {
      const question = String(qa.question || '').trim();
      const answer = String(qa.answer || '').trim();
      if (!question || !answer) return null;
      return {
        _id: qa._id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        date: qa.date ? new Date(qa.date) : new Date(),
        question,
        answer,
        category: qa.category || 'practical',
        tags: Array.isArray(qa.tags) ? qa.tags : [],
        steps: qa.steps,
        alternatives: qa.alternatives,
        originalChat: qa.originalChat,
        feedback: qa.feedback || { useful: 0, useless: 0 },
        createdAt: qa.createdAt ? new Date(qa.createdAt) : new Date(),
        updatedAt: qa.updatedAt ? new Date(qa.updatedAt) : new Date(),
      };
    };

    const applyQAs = (list: QAKnowledge[]) => {
      setExtractedQAs(list);
      const tags = new Set<string>();
      list.forEach((qa: QAKnowledge) => {
        (qa.tags || []).forEach((tag: string) => tags.add(tag));
      });
      setAllTags(Array.from(tags));
    };

    try {
      const response = await fetch(`${API_ORIGIN}/api/qa/extracted`);
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      const result = await response.json();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        const normalized = result.data
          .map(normalizeQa)
          .filter((item): item is QAKnowledge => Boolean(item));
        if (normalized.length > 0) {
          // 若解析结果偏少，补充部分 mock 以保证展示
          const merged =
            normalized.length >= 6
              ? normalized
              : [...normalized, ...mockQAs].slice(0, 12);
          applyQAs(merged);
        } else {
          applyQAs(mockQAs);
        }
      } else {
        applyQAs(mockQAs);
      }
    } catch (error) {
      console.error('加载知识库失败:', error);
      applyQAs(mockQAs);
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
  };

  const handleLogDateRangeChange = (start: Date | null, end: Date | null) => {
    setLogStartDate(start);
    setLogEndDate(end);
  };

  const handleCommunityDateRangeChange = (start: Date | null, end: Date | null) => {
    setCommunityStartDate(start);
    setCommunityEndDate(end);
  };

  const openCoachModal = (coach = coachShowcase[0]) => {
    setSelectedCoach(coach);
    setCoachModalOpen(true);
    setCoachPrefill({ title: '', description: '', hasAIContext: false });
  };

  const closeCoachModal = () => {
    setCoachModalOpen(false);
  };

  const openMyCenter = (tab: MyCenterTab, overrides?: Partial<typeof myFilters>) => {
    setMyCenterTab(tab);
    setMyCenterOpen(true);
    if (overrides) {
      setMyFilters((prev) => ({ ...prev, ...overrides }));
    }
  };

  const closeMyCenter = () => {
    setMyCenterOpen(false);
    setMyDetailItem(null);
  };

  const openAiModal = () => {
    setAiModalOpen(true);
  };

  const closeAiModal = () => {
    setAiModalOpen(false);
  };

  const generateAiReply = (question: string) => {
    return `给你一个快速排查思路：\n\n1. 先确认是否为环境变量前缀导致前端读取不到。\n2. 如果是服务端接口，请检查部署环境是否有刷新。\n\n示例：\n\`\`\`bash\nNEXT_PUBLIC_API_BASE=https://example.com\n\`\`\`\n\n> 如仍有问题，可以贴出报错日志，我来帮你定位。`;
  };


  const handleSendAi = () => {
    const text = aiInput.trim();
    if (!text) return;
    setAiMessages((prev) => [...prev, { role: 'user', content: text }]);
    setAiInput('');
    setAiStatus('thinking');
    const aiReply = generateAiReply(text);
    window.setTimeout(() => {
      setAiMessages((prev) => {
        const nextMessages: AiMessage[] = [...prev, { role: 'ai', content: aiReply }];
        const summary = aiReply.split('\n').slice(0, 4).join('\n');
        const history = nextMessages
          .map((msg) => `${msg.role === 'user' ? '用户' : 'AI'}：${msg.content}`)
          .join('\n');
        setAiSummary(summary);
        setAiHistory(history);
        setCoachPrefill({
          title: text.slice(0, 32),
          description: `${text}\n\nAI回答摘要：\n${summary}`,
          hasAIContext: true,
          aiSummary: summary,
          aiHistory: history,
        });
        return nextMessages;
      });
      setAiStatus('online');
    }, 700);
  };

  const handleSubmitCoachQuestion = (data: {
    title: string;
    description: string;
    allowCrewAnswer: boolean;
    attachAIContext: boolean;
    aiSummary?: string;
    aiHistory?: string;
    attachments?: { type: 'image' | 'video'; url: string }[];
  }) => {
    const payload: CreatePostData = {
      title: data.title.trim(),
      content: {
        stage: '',
        problem: data.description.trim(),
        attempts: '',
      },
      allowReplies: data.allowCrewAnswer,
      includeAI: data.attachAIContext,
      aiSummary: data.attachAIContext ? data.aiSummary : undefined,
      aiHistory: data.attachAIContext ? data.aiHistory : undefined,
      attachments: data.attachments || [],
    };
    handleSubmitPost(payload);
    setCoachModalOpen(false);
  };

  const handleScrollLeaderboard = (tab: 'question' | 'coach') => {
    setLeaderboardTab(tab);
    const element = document.getElementById('community-leaderboard');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const activeVoyage = voyageOptions.find((voyage) => voyage.id === activeVoyageId);
  const voyageName = (activeVoyage?.name || '').replace(/\s+/g, '');
  const displayName = currentUser.name === '当前用户' ? '香菜' : currentUser.name;
  const isRobotExpanded = !isRobotCollapsed || isRobotHover;
  const aiStatusLabel =
    aiStatus === 'thinking' ? '思考中…' : aiStatus === 'online' ? '在线' : '可帮忙';
  const aiWrapperStyle =
    robotPos && showRobot
      ? {
          left: robotPos.x,
          top: robotPos.y,
        }
      : undefined;

  const HeroSection = () => (
    <div className={styles.heroSection}>
      <div className={styles.heroPanel}>
        <div className={styles.heroIcon}>
          <img src="/ai-logo.png" alt="AI" className={styles.heroIconImage} />
        </div>
        <div className={styles.heroContent}>
          <div className={styles.heroTitle}>求助站</div>
          <div className={styles.heroMeta}>562 位提问者 · 10000+ 问题</div>
          <div className={styles.heroDesc}>
            这里汇聚航海伙伴与教练的实战解法，帮助你快速解决关键问题。
          </div>
        </div>
      </div>
    </div>
  );

  const CoachFloatingCards = () => (
    <div className={styles.coachSection}>
      <div className={styles.coachSectionTitle}>本期航海教练</div>
      <div className={styles.coachGlassScroller}>
        <div className={styles.coachGlassGrid}>
          {coachShowcase.map((coach) => (
            <div key={coach.id} className={styles.coachGlassCard}>
              <div className={styles.coachGlassHeader}>
                <div className={styles.coachGlassAvatar}>
                  {coach.name.slice(0, 1)}
                  <span className={styles.coachGlassStatus} />
                </div>
                <div className={styles.coachGlassTitle}>
                  <div className={styles.coachGlassNameRow}>
                    <span className={styles.coachGlassName}>{coach.name}</span>
                    <span className={styles.coachGlassBadge}>教练</span>
                  </div>
                  <div className={styles.coachGlassMeta}>擅长：{coach.specialty}</div>
                </div>
              </div>
              <div className={styles.coachGlassDesc}>
                擅长{coach.specialty}，可以帮你快速梳理关键思路。
              </div>
              <button className={styles.coachGlassCta} onClick={() => openCoachModal(coach)}>
                向教练提问
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const allMyItems: MyCenterItem[] = React.useMemo(() => {
    const questionSeed = posts.slice(0, 6).map((post, index) => ({
      id: `my-q-${post._id}`,
      tab: 'question' as const,
      title: post.title,
      category: categoryLabelMap[post.content.stage] || '技术问题',
      voyage: activeVoyage?.issue || '第12期',
      time: post.createdAt,
      status: post.status || (index % 2 === 0 ? 'pending' : 'resolved'),
      mentionsCoach: Boolean(post.mentions && post.mentions.length > 0),
      allowCrew: post.allowReplies !== false,
      postId: post._id,
    }));
    const answerSeed = posts.slice(0, 5).map((post, index) => ({
      id: `my-a-${post._id}`,
      tab: 'answer' as const,
      title: post.title,
      category: categoryLabelMap[post.content.stage] || '技术问题',
      voyage: activeVoyage?.issue || '第12期',
      time: post.createdAt,
      adopted: index % 2 === 0,
      likes: (post.replies?.[0]?.likes || 0) + index * 3,
      postId: post._id,
    }));
    const favoriteSeed: MyCenterItem[] = [
      {
        id: 'fav-1',
        tab: 'favorite',
        title: 'Next.js 环境变量部署后不生效如何排查？',
        category: '技术问题',
        voyage: activeVoyage?.issue || '第12期',
        time: new Date(Date.now() - 2 * 24 * 3600 * 1000),
        origin: 'community',
        source: 'coach',
        postId: posts[0]?._id,
      },
      {
        id: 'fav-2',
        tab: 'favorite',
        title: 'MongoDB 聚合查询性能优化清单',
        category: '实操技巧',
        voyage: activeVoyage?.issue || '第12期',
        time: new Date(Date.now() - 4 * 24 * 3600 * 1000),
        origin: 'faq',
        source: 'ai',
      },
    ];
    return [...questionSeed, ...answerSeed, ...favoriteSeed];
  }, [posts, activeVoyage]);

  const filteredMyItems = React.useMemo(() => {
    let items = allMyItems.filter((item) => item.tab === myCenterTab);
    if (myCenterSearch.trim()) {
      const keyword = myCenterSearch.trim();
      items = items.filter((item) => item.title.includes(keyword));
    }
    if (myFilters.category !== 'all') {
      items = items.filter((item) => item.category === categoryLabelMap[myFilters.category]);
    }
    if (myFilters.voyage !== 'all') {
      items = items.filter((item) => item.voyage === myFilters.voyage);
    }
    if (myCenterTab === 'question') {
      if (myFilters.status !== 'all') {
        items = items.filter((item) => item.status === myFilters.status);
      }
      if (myFilters.mention !== 'all') {
        items = items.filter(
          (item) => item.mentionsCoach === (myFilters.mention === 'yes')
        );
      }
      if (myFilters.allowCrew !== 'all') {
        items = items.filter((item) => item.allowCrew === (myFilters.allowCrew === 'yes'));
      }
    }
    if (myCenterTab === 'answer') {
      if (myFilters.adopted !== 'all') {
        items = items.filter((item) => item.adopted === (myFilters.adopted === 'yes'));
      }
      if (myFilters.like !== 'all') {
        items = items.filter((item) => (item.likes || 0) >= 10);
      }
    }
    if (myCenterTab === 'favorite') {
      if (myFilters.favType !== 'all') {
        items = items.filter((item) => item.origin === myFilters.favType);
      }
      if (myFilters.source !== 'all') {
        items = items.filter((item) => item.source === myFilters.source);
      }
    }
    if (myFilters.sort === 'latest') {
      items = [...items].sort((a, b) => b.time.getTime() - a.time.getTime());
    }
    return items;
  }, [allMyItems, myCenterTab, myCenterSearch, myFilters]);

  const MyCenterSegmented = () => (
    <div className={styles.myCenterTabs}>
      {[
        { key: 'question', label: '我的提问' },
        { key: 'answer', label: '我的回答' },
        { key: 'favorite', label: '我的收藏' },
      ].map((tab) => (
        <button
          key={tab.key}
          className={`${styles.myCenterTab} ${
            myCenterTab === tab.key ? styles.myCenterTabActive : ''
          }`}
          onClick={() => setMyCenterTab(tab.key as MyCenterTab)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  const MyItemCard = ({ item }: { item: MyCenterItem }) => (
    <div className={styles.myItemCard}>
      <div className={styles.myItemMain} onClick={() => setMyDetailItem(item)}>
        <div className={styles.myItemTitle}>{item.title}</div>
        <div className={styles.myItemMeta}>
          <span className={styles.myItemTag}>{item.category}</span>
          <span>{format(new Date(item.time), 'yyyy-MM-dd')}</span>
          <span>{item.voyage}</span>
          {item.status && (
            <span
              className={`${styles.myItemStatus} ${
                item.status === 'pending' ? styles.myItemStatusPending : styles.myItemStatusResolved
              }`}
            >
              {item.status === 'pending' ? '待解决' : '已解决'}
            </span>
          )}
        </div>
      </div>
      <div className={styles.myItemActions}>
        {item.tab === 'question' && (
          <button
            className={styles.myItemActionBtn}
            onClick={() => setMyDetailItem(item)}
          >
            {item.status === 'pending' ? '去解决' : '查看'}
          </button>
        )}
        {item.tab === 'answer' && (
          <button className={styles.myItemActionBtn} onClick={() => setMyDetailItem(item)}>
            查看原帖
          </button>
        )}
        {item.tab === 'favorite' && (
          <button className={styles.myItemActionBtn} onClick={() => setMyDetailItem(item)}>
            查看原帖
          </button>
        )}
      </div>
    </div>
  );

  const selectedPost = myDetailItem?.postId
    ? posts.find((post) => post._id === myDetailItem.postId)
    : undefined;
  const selectedMyQA = React.useMemo(() => {
    if (!myDetailItem) return undefined;
    if (myDetailItem.origin !== 'faq') return undefined;
    const byTitle =
      extractedQAs.find((qa) => qa.question.includes(myDetailItem.title)) ||
      extractedQAs.find((qa) => myDetailItem.title.includes(qa.question));
    if (byTitle) return byTitle;
    return mockQAs.find((qa) => myDetailItem.title.includes(qa.question));
  }, [myDetailItem, extractedQAs]);


  return (
    <div>
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
            headerSlot={
              <ContentModeSwitch value={activeMainTab} onChange={setActiveMainTab} />
            }
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
              <div className={styles.contentSwitchRow}>
                <ContentModeSwitch value={activeMainTab} onChange={setActiveMainTab} />
              </div>
              <section className={styles.heroContainer}>
                <HeroSection />
                <CoachFloatingCards />
              </section>

              <div className={styles.filterPanel}>
                <div className={styles.statusRow}>
                  <div className={styles.controlBar}>
                    <StatusTabs
                      activeTab={communityTab}
                      onTabChange={setCommunityTab}
                      counts={postCounts}
                    />
                    <div className={styles.controlActions}>
                      <div className={styles.toolbarControls}>
                        <select
                          className={styles.toolbarSelect}
                          value={communityCoach}
                          onChange={(e) => setCommunityCoach(e.target.value)}
                        >
                          <option value="all">全部教练</option>
                          <option value="教练小夏">教练小夏</option>
                          <option value="教练阿北">教练阿北</option>
                          <option value="教练Mia">教练Mia</option>
                        </select>
                        <select
                          className={styles.toolbarSelect}
                          value={communitySort}
                          onChange={(e) => setCommunitySort(e.target.value as 'latest' | 'hot')}
                        >
                          <option value="latest">最新发布</option>
                          <option value="hot">最多互动</option>
                        </select>
                        <DateRangeFilter
                          startDate={communityStartDate || undefined}
                          endDate={communityEndDate || undefined}
                          onRangeChange={handleCommunityDateRangeChange}
                        />
                      </div>
                    </div>
                  </div>
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
              <div ref={userPanelRef} className={styles.userPanelA}>
                <div className={styles.profileCard}>
                  <div className={styles.profileAvatar}>{displayName.slice(0, 1)}</div>
                  <div className={styles.profileInfo}>
                    <div className={styles.profileNameRow}>
                      <span className={styles.profileName}>{displayName}</span>
                      <span className={styles.profileRoleTag}>{currentUser.role}</span>
                    </div>
                    <div className={styles.profileMeta}>
                      {voyageName} · {activeVoyage?.issue}
                    </div>
                  </div>
                  <button className={styles.profileMoreBtn} aria-label="更多">
                    ⋯
                  </button>
                </div>

                <div className={styles.heroCardA}>
                  <div className={styles.heroCardHeader}>
                    <div>
                      <div className={styles.heroCardTitle}>
                        {voyageName} · {activeVoyage?.issue}
                      </div>
                      <div className={styles.heroCardSub}>{activeVoyage?.range}</div>
                    </div>
                    <div className={styles.heroCardRight}>
                      <span className={styles.heroStatusTag}>进行中</span>
                      <button
                        className={styles.heroSwitchBtn}
                        onClick={() => setVoyageSwitchOpen(true)}
                      >
                        切换航海
                      </button>
                    </div>
                  </div>
                  <div className={styles.heroProgress}>
                    <div className={styles.heroProgressText}>已进行 12/30 天</div>
                    <div className={styles.heroProgressBar}>
                      <span style={{ width: '40%' }} />
                    </div>
                  </div>
                </div>

                <div className={styles.statsCardA}>
                  <div className={styles.statsItemA}>
                    <span className={styles.statsIconA}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
                        <path
                          d="M10.2 9.6c.2-1.1 1.2-1.9 2.4-1.9 1.5 0 2.6 1 2.6 2.3 0 1-.6 1.7-1.6 2.1-.6.3-.9.7-.9 1.3"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinecap="round"
                        />
                        <circle cx="12" cy="16.6" r="0.9" fill="currentColor" />
                      </svg>
                    </span>
                    <div className={styles.statsValueA}>{currentUser.stats.questions}</div>
                    <div className={styles.statsLabelA}>提问</div>
                  </div>
                  <div className={styles.statsItemA}>
                    <span className={styles.statsIconA}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M7.5 17.5 4 20V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6A2.5 2.5 0 0 1 17.5 15h-8"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.4"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className={styles.statsValueA}>{currentUser.stats.answers}</div>
                    <div className={styles.statsLabelA}>回答</div>
                  </div>
                  <div className={styles.statsItemA}>
                    <span className={styles.statsIconA}>
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M5.5 12.5 10 17l8.5-9"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.6"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <div className={styles.statsValueA}>{currentUser.stats.adopted}</div>
                    <div className={styles.statsLabelA}>被采纳</div>
                  </div>
                </div>

                <div className={styles.quickCardA}>
                  <button className={styles.quickRow} onClick={() => openMyCenter('question')}>
                    <span className={styles.quickLeft}>
                      <span className={styles.quickIcon}>●</span>我的提问
                    </span>
                    <span className={styles.quickRight}>
                      <span className={styles.quickBadge}>{currentUser.stats.questions}</span>
                      <span className={styles.quickChevron}>›</span>
                    </span>
                  </button>
                  <button className={styles.quickRow} onClick={() => openMyCenter('answer')}>
                    <span className={styles.quickLeft}>
                      <span className={styles.quickIcon}>●</span>我的回答
                    </span>
                    <span className={styles.quickRight}>
                      <span className={styles.quickBadge}>{currentUser.stats.answers}</span>
                      <span className={styles.quickChevron}>›</span>
                    </span>
                  </button>
                  <button className={styles.quickRow} onClick={() => openMyCenter('favorite')}>
                    <span className={styles.quickLeft}>
                      <span className={styles.quickIcon}>●</span>我的收藏
                    </span>
                    <span className={styles.quickRight}>
                      <span className={styles.quickChevron}>›</span>
                    </span>
                  </button>
                </div>

                {showReminder && currentUser.unresolved > 0 && (
                  <div className={styles.reminderCardA}>
                    <div className={styles.reminderText}>
                      你还有 <strong>{currentUser.unresolved}</strong> 个问题待解决
                    </div>
                    <div className={styles.reminderActions}>
                      <button
                        className={styles.reminderBtn}
                        onClick={() => openMyCenter('question', { status: 'pending' })}
                      >
                        去解决
                      </button>
                      <button
                        className={styles.reminderClose}
                        onClick={() => setShowReminder(false)}
                        aria-label="隐藏提醒"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                )}
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
                    (leader, index) => {
                      const rank = index + 1;
                      const isTop = rank <= 3;
                      const isTop1 = rank === 1;
                      const medalClass = isTop ? styles[`rankMedal${rank}`] || '' : '';
                      return (
                        <div
                          key={leader.id}
                          className={`${styles.rankItem} ${isTop ? styles.rankItemTop : ''} ${
                            isTop1 ? styles.rankItemTop1 : ''
                          }`}
                        >
                          <span
                            className={`${styles.rankIcon} ${
                              isTop ? styles.rankIconMedal : styles.rankIconPlain
                            } ${medalClass}`}
                            title={isTop ? `Top${rank}` : undefined}
                          >
                            {isTop ? (
                              <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path
                                  d="M9 4h6l-1 4H10L9 4Z"
                                  fill="currentColor"
                                  opacity="0.35"
                                />
                                <circle
                                  cx="12"
                                  cy="13"
                                  r="5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                />
                                <path
                                  d="M10 18.5 9 21l3-1.6 3 1.6-1-2.5"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="1.6"
                                  strokeLinejoin="round"
                                  strokeLinecap="round"
                                />
                                <text
                                  x="12"
                                  y="14.5"
                                  textAnchor="middle"
                                  fontSize="8"
                                  fontWeight="700"
                                  fill="currentColor"
                                >
                                  {rank}
                                </text>
                              </svg>
                            ) : (
                              rank
                            )}
                          </span>
                          <div
                            className={`${styles.rankAvatar} ${
                              isTop1 ? styles.rankAvatarTop1 : ''
                            }`}
                          >
                            {leader.name.slice(0, 1)}
                          </div>
                          <div className={styles.rankInfo}>
                            <div className={`${styles.rankName} ${isTop ? styles.rankNameTop : ''}`}>
                              {leader.name}
                            </div>
                            <div className={styles.rankMeta}>
                              {leaderboardTab === 'question' ? (
                                <>
                                  提问 {(leader as typeof questionLeaders[number]).questions} · 已解决{' '}
                                  {(leader as typeof questionLeaders[number]).resolved} ·{' '}
                                  <strong>获赞 {(leader as typeof questionLeaders[number]).likes}</strong>
                                </>
                              ) : (
                                <>
                                  回答 {(leader as typeof coachLeaders[number]).answers} · 被采纳{' '}
                                  {(leader as typeof coachLeaders[number]).adopted} ·{' '}
                                  <strong>获赞 {(leader as typeof coachLeaders[number]).likes}</strong>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <button className={styles.rankMore}>查看更多 ⌄</button>
              </div>
            </aside>

            {voyageSwitchOpen && (
              <div className={styles.voyageSheetMask} onClick={() => setVoyageSwitchOpen(false)}>
                <div
                  className={styles.voyageSheet}
                  onClick={(event) => event.stopPropagation()}
                >
                  <div className={styles.voyageSheetHeader}>切换航海</div>
                  <div className={styles.voyageSheetList}>
                    {voyageOptions.map((voyage) => {
                      const isActive = voyage.id === activeVoyageId;
                      return (
                        <button
                          key={voyage.id}
                          className={`${styles.voyageSheetItem} ${
                            isActive ? styles.voyageSheetItemActive : ''
                          }`}
                          onClick={() => {
                            setActiveVoyageId(voyage.id as 'v1' | 'v2');
                            setVoyageSwitchOpen(false);
                          }}
                        >
                          <span>{voyage.name.replace(/\\s+/g, '')} · {voyage.issue}</span>
                          {isActive && <span className={styles.voyageSheetCheck}>当前</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {showRobot && (
            <div
              className={styles.aiFloatingWrapper}
              style={aiWrapperStyle}
              data-visible={robotPos ? 'true' : 'false'}
            >
              <button
                type="button"
                className={`${styles.aiFloating} ${
                  isRobotExpanded ? styles.aiFloatingExpanded : styles.aiFloatingCollapsed
                } ${playRobotIntro ? styles.aiFloatingIntro : ''}`}
                onClick={() => {
                  if (dragMovedRef.current) {
                    dragMovedRef.current = false;
                    return;
                  }
                  openAiModal();
                }}
                ref={robotRef}
                onMouseEnter={() => {
                  if (hoverCollapseTimer.current) {
                    window.clearTimeout(hoverCollapseTimer.current);
                  }
                  setIsRobotHover(true);
                }}
                onMouseLeave={() => {
                  if (hoverCollapseTimer.current) {
                    window.clearTimeout(hoverCollapseTimer.current);
                  }
                  hoverCollapseTimer.current = window.setTimeout(() => {
                    setIsRobotHover(false);
                  }, 800);
                }}
                onPointerDown={(event) => {
                  if (!robotRef.current) return;
                  event.preventDefault();
                  dragMovedRef.current = false;
                  const rect = robotRef.current.getBoundingClientRect();
                  dragDataRef.current = {
                    offsetX: event.clientX - rect.left,
                    offsetY: event.clientY - rect.top,
                    startX: event.clientX,
                    startY: event.clientY,
                  };
                  setRobotDragged(true);
                  robotRef.current.setPointerCapture(event.pointerId);
                }}
                onPointerMove={(event) => {
                  if (!dragDataRef.current || !robotRef.current) return;
                  const dx = event.clientX - dragDataRef.current.startX;
                  const dy = event.clientY - dragDataRef.current.startY;
                  if (Math.hypot(dx, dy) > 3) {
                    dragMovedRef.current = true;
                  }
                  const rect = robotRef.current.getBoundingClientRect();
                  const padding = 12;
                  let x = event.clientX - dragDataRef.current.offsetX;
                  let y = event.clientY - dragDataRef.current.offsetY;
                  x = Math.max(padding, Math.min(window.innerWidth - rect.width - padding, x));
                  y = Math.max(80, Math.min(window.innerHeight - rect.height - padding, y));
                  setRobotPos({ x, y });
                }}
                onPointerUp={() => {
                  dragDataRef.current = null;
                  if (robotPosRef.current) {
                    safeLocalSet('aiRobotPos', JSON.stringify(robotPosRef.current));
                  }
                }}
                onPointerCancel={() => {
                  dragDataRef.current = null;
                }}
                aria-label="AI 航海助手"
              >
                {showRobotTip && <div className={styles.aiFloatingTip}>先问我试试？</div>}
                {isRobotExpanded && (
                  <div className={styles.aiFloatingBubble}>我在～先问我试试！</div>
                )}
                <div className={styles.aiFloatingAvatarWrap}>
                  <img
                    className={styles.aiFloatingAvatar}
                    src="/ai-robot.png"
                    alt="AI 航海助手"
                  />
                  <span
                    className={`${styles.aiStatusDot} ${styles[`aiStatus${aiStatus}`]}`}
                    title={aiStatusLabel}
                    aria-label={aiStatusLabel}
                  />
                </div>
                <div className={styles.aiFloatingText} aria-hidden={!isRobotExpanded}>
                  <div className={styles.aiFloatingTitle}>AI 航海助手</div>
                  <div className={styles.aiFloatingDesc}>
                    我可以先帮你解决大多数常见问题
                  </div>
                </div>
              </button>
            </div>
          )}

          {aiModalOpen && (
            <div className={styles.modalBackdrop} onClick={closeAiModal}>
              <div className={styles.aiModal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.aiModalHeader}>
                  <img className={styles.aiModalAvatar} src="/ai-robot.png" alt="AI 航海助手" />
                  <div>
                    <div className={styles.aiModalTitle}>AI 航海助手</div>
                    <div className={styles.aiModalDesc}>直接描述你的问题，我会先给你解决方案</div>
                  </div>
                </div>
                <div className={styles.aiModalBody}>
                  {aiMessages.length === 0 && (
                    <div className={styles.aiEmpty}>
                      直接描述你的问题，AI 会先给出排查方向与参考方案。
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
                    ref={aiInputRef}
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    placeholder="直接向 AI 提问，立即获得解答"
                  />
                  <button onClick={handleSendAi}>发送</button>
                </div>
                <button className={styles.aiModalHint} onClick={() => aiInputRef.current?.focus()}>
                  💡 推荐先问 AI，80% 常见问题可即时解决；未解决再向教练提问
                </button>
              </div>
            </div>
          )}

          <AskCoachModal
            open={coachModalOpen}
            coach={selectedCoach}
            prefill={coachPrefill}
            onClose={closeCoachModal}
            onSubmitted={handleSubmitCoachQuestion}
            aiMessages={aiMessages}
            aiInputValue={aiInput}
            onAiInput={setAiInput}
            onSendAi={handleSendAi}
            aiStatusLabel={aiStatusLabel}
            onAttachAI={(summary, history) => {
              setAiSummary(summary);
              setAiHistory(history);
              setCoachPrefill((prev) => ({
                ...prev,
                hasAIContext: Boolean(summary || history),
                aiSummary: summary,
                aiHistory: history,
              }));
            }}
          />

          {myCenterOpen && (
            <div className={styles.myCenterBackdrop} onClick={closeMyCenter}>
              <div
                className={styles.myCenterPanel}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.myCenterHeader}>
                  <div>
                    <div className={styles.myCenterTitle}>我的内容中心</div>
                    <div className={styles.myCenterSubtitle}>集中管理我的提问/回答/收藏</div>
                  </div>
                  <button className={styles.myCenterClose} onClick={closeMyCenter}>
                    ✕
                  </button>
                </div>

                <MyCenterSegmented />

                <div className={styles.myCenterSearchRow}>
                  <input
                    className={styles.myCenterSearch}
                    placeholder="搜索标题/关键词"
                    value={myCenterSearch}
                    onChange={(e) => setMyCenterSearch(e.target.value)}
                  />
                  <button
                    className={styles.myCenterFilterToggle}
                    onClick={() => setMyCenterFiltersOpen((prev) => !prev)}
                  >
                    更多筛选
                  </button>
                </div>

                <div className={styles.myCenterFilters}>
                  <select
                    value={myFilters.time}
                    onChange={(e) => setMyFilters((prev) => ({ ...prev, time: e.target.value }))}
                  >
                    <option value="all">时间</option>
                    <option value="7d">近7天</option>
                    <option value="1m">近1月</option>
                    <option value="3m">近3月</option>
                  </select>
                  <select
                    value={myFilters.voyage}
                    onChange={(e) => setMyFilters((prev) => ({ ...prev, voyage: e.target.value }))}
                  >
                    <option value="all">航海</option>
                    <option value={activeVoyage?.issue || '第12期'}>
                      {activeVoyage?.issue || '第12期'}
                    </option>
                  </select>
                  <select
                    value={myFilters.category}
                    onChange={(e) => setMyFilters((prev) => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="all">分类</option>
                    {communityCategories
                      .filter((category) => category.key !== 'all')
                      .map((category) => (
                        <option key={category.key} value={category.key}>
                          {category.label}
                        </option>
                      ))}
                  </select>
                  <select
                    value={myFilters.sort}
                    onChange={(e) => setMyFilters((prev) => ({ ...prev, sort: e.target.value }))}
                  >
                    <option value="latest">排序：最新</option>
                    <option value="hot">排序：热门</option>
                  </select>
                </div>

                {myCenterFiltersOpen && (
                  <div className={styles.myCenterFiltersMore}>
                    {myCenterTab === 'question' && (
                      <>
                        <select
                          value={myFilters.status}
                          onChange={(e) =>
                            setMyFilters((prev) => ({ ...prev, status: e.target.value }))
                          }
                        >
                          <option value="all">状态：全部</option>
                          <option value="pending">待解决</option>
                          <option value="resolved">已解决</option>
                        </select>
                        <select
                          value={myFilters.mention}
                          onChange={(e) =>
                            setMyFilters((prev) => ({ ...prev, mention: e.target.value }))
                          }
                        >
                          <option value="all">@教练：全部</option>
                          <option value="yes">已@教练</option>
                          <option value="no">未@教练</option>
                        </select>
                        <select
                          value={myFilters.allowCrew}
                          onChange={(e) =>
                            setMyFilters((prev) => ({ ...prev, allowCrew: e.target.value }))
                          }
                        >
                          <option value="all">船员回答：全部</option>
                          <option value="yes">允许</option>
                          <option value="no">不允许</option>
                        </select>
                      </>
                    )}
                    {myCenterTab === 'answer' && (
                      <>
                        <select
                          value={myFilters.adopted}
                          onChange={(e) =>
                            setMyFilters((prev) => ({ ...prev, adopted: e.target.value }))
                          }
                        >
                          <option value="all">是否采纳：全部</option>
                          <option value="yes">已采纳</option>
                          <option value="no">未采纳</option>
                        </select>
                        <select
                          value={myFilters.like}
                          onChange={(e) => setMyFilters((prev) => ({ ...prev, like: e.target.value }))}
                        >
                          <option value="all">获赞数：全部</option>
                          <option value="high">≥10</option>
                        </select>
                      </>
                    )}
                    {myCenterTab === 'favorite' && (
                      <>
                        <select
                          value={myFilters.favType}
                          onChange={(e) =>
                            setMyFilters((prev) => ({ ...prev, favType: e.target.value }))
                          }
                        >
                          <option value="all">类型：全部</option>
                          <option value="faq">百问百答</option>
                          <option value="community">社区问答</option>
                        </select>
                        <select
                          value={myFilters.source}
                          onChange={(e) =>
                            setMyFilters((prev) => ({ ...prev, source: e.target.value }))
                          }
                        >
                          <option value="all">来源：全部</option>
                          <option value="ai">AI</option>
                          <option value="coach">教练</option>
                          <option value="member">船员</option>
                        </select>
                      </>
                    )}
                  </div>
                )}

                <div className={styles.myCenterList}>
                  {filteredMyItems.length > 0 ? (
                    filteredMyItems.map((item) => <MyItemCard key={item.id} item={item} />)
                  ) : (
                    <div className={styles.myCenterEmpty}>
                      <div className={styles.myCenterEmptyTitle}>暂无内容</div>
                      <div className={styles.myCenterEmptyDesc}>
                        去提一个问题或先问 AI 获取灵感。
                      </div>
                      <div className={styles.myCenterEmptyActions}>
                        <button onClick={openAiModal}>去问 AI</button>
                        <button onClick={() => openMyCenter('question')}>去看待解决问题</button>
                        <button onClick={() => setActiveMainTab('log')}>去逛百问百答</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {myDetailItem && (
            <div className={styles.myDetailBackdrop} onClick={() => setMyDetailItem(null)}>
              <div
                className={styles.myDetailDrawer}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.myDetailHeader}>
                  <div className={styles.myDetailTitle}>帖子详情</div>
                  <button onClick={() => setMyDetailItem(null)}>✕</button>
                </div>
                <div className={styles.myDetailBody}>
                  <div className={styles.myDetailSection}>
                    <div className={styles.myDetailTitleRow}>
                      <div className={styles.myDetailTitleText}>{myDetailItem.title}</div>
                      {myDetailItem.status && (
                        <span
                          className={`${styles.myDetailStatus} ${
                            myDetailItem.status === 'pending'
                              ? styles.myDetailStatusPending
                              : styles.myDetailStatusResolved
                          }`}
                        >
                          {myDetailItem.status === 'pending' ? '待解决' : '已解决'}
                        </span>
                      )}
                    </div>
                    <div className={styles.myDetailMeta}>
                      <span>{myDetailItem.category}</span>
                      <span>{myDetailItem.voyage}</span>
                      <span>{format(myDetailItem.time, 'yyyy-MM-dd HH:mm')}</span>
                    </div>
                  </div>

                  {selectedPost && (
                    <>
                      <div className={styles.myDetailSection}>
                        <div className={styles.myDetailLabel}>问题描述</div>
                        <div className={styles.myDetailContent}>{selectedPost.content.problem}</div>
                        {selectedPost.content.attempts && (
                          <>
                            <div className={styles.myDetailLabel}>补充信息</div>
                            <div className={styles.myDetailContent}>
                              {selectedPost.content.attempts}
                            </div>
                          </>
                        )}
                        {selectedPost.attachments && selectedPost.attachments.length > 0 && (
                          <div className={styles.myDetailAttachments}>
                            {selectedPost.attachments.map((attachment, index) => (
                              <div key={`${attachment.url}-${index}`} className={styles.myDetailAttachment}>
                                {attachment.type === 'video' ? (
                                  <video src={attachment.url} controls />
                                ) : (
                                  <img src={attachment.url} alt="附件预览" />
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className={styles.myDetailSection}>
                        <div className={styles.myDetailLabel}>
                          相关回答（{selectedPost.replies?.length || 0}）
                        </div>
                        <div className={styles.myDetailAnswerList}>
                          {(selectedPost.replies || []).length > 0 ? (
                            selectedPost.replies!.map((reply) => (
                              <div key={reply._id} className={styles.myDetailAnswerItem}>
                                <div className={styles.myDetailAnswerHeader}>
                                  <span>{reply.author?.nickname || '匿名用户'}</span>
                                  {reply.isAdopted && (
                                    <span className={styles.myDetailAnswerBadge}>已采纳</span>
                                  )}
                                </div>
                                <div className={styles.myDetailContent}>{reply.content}</div>
                              </div>
                            ))
                          ) : (
                            <div className={styles.myDetailEmpty}>暂无回答</div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {selectedMyQA && (
                    <>
                      <div className={styles.myDetailSection}>
                        <div className={styles.myDetailLabel}>问题</div>
                        <div className={styles.myDetailContent}>{selectedMyQA.question}</div>
                      </div>
                      <div className={styles.myDetailSection}>
                        <div className={styles.myDetailLabel}>答案</div>
                        <div className={styles.myDetailContent}>{selectedMyQA.answer}</div>
                      </div>
                    </>
                  )}
                </div>
                <div className={styles.myDetailActions}>
                  <button className={styles.myDetailBtnPrimary}>打开详情</button>
                  <button className={styles.myDetailBtnGhost} onClick={() => setMyDetailItem(null)}>
                    关闭
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
