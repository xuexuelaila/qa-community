import React, { useMemo, useState } from 'react';
import { Post, Reply, SubReply } from '@/types/post';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { stripEmojis } from '@/lib/text';
import styles from './PostCard.module.css';

interface PostCardProps {
  post: Post;
  onClick?: () => void;
}

const roleLabels = {
  captain: '领航员',
  assistant: '助教',
  member: '船友',
};

const categoryLabels: Record<string, string> = {
  tech: '技术问题',
  tool: '工具使用',
  process: '流程疑问',
  other: '其他',
};

export default function PostCard({ post, onClick }: PostCardProps) {
  const author = post.author || {
    nickname: '匿名用户',
    role: 'member' as const,
    avatar: '',
  };
  const localUserId = '1';
  const isOwner = post.authorId === localUserId;

  const [status, setStatus] = useState<Post['status']>(post.status);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyInput, setReplyInput] = useState('');
  const [replySort, setReplySort] = useState<'latest' | 'likes'>('latest');
  const [localReplies, setLocalReplies] = useState<Reply[]>(post.replies || []);
  const [adoptedId, setAdoptedId] = useState<string | null>(
    (post.replies || []).find((reply) => reply.isAdopted)?._id || null
  );
  const [replyLikes, setReplyLikes] = useState<Record<string, { count: number; liked: boolean }>>(
    () => {
      const map: Record<string, { count: number; liked: boolean }> = {};
      (post.replies || []).forEach((reply) => {
        map[reply._id] = { count: reply.likes || 0, liked: false };
      });
      return map;
    }
  );
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [commentOpen, setCommentOpen] = useState<Record<string, boolean>>({});

  const sanitizedTitle = stripEmojis(post.title);
  const sanitizedProblem = stripEmojis(post.content.problem);
  const sanitizedStage = stripEmojis(post.content.stage);
  const sanitizedNickname = stripEmojis(author.nickname);
  const sanitizedAttempts = stripEmojis(post.content.attempts);
  const mentionNames = post.mentions || [];
  const categoryLabel = categoryLabels[sanitizedStage] || sanitizedStage || '未分类';
  const adoptedReply =
    localReplies.find((reply) => reply._id === adoptedId) ||
    localReplies.find((reply) => reply.isAdopted);
  const canReply = post.allowReplies !== false;

  const sortedReplies = useMemo(() => {
    const list = [...localReplies];
    if (replySort === 'likes') {
      const sorted = list.sort((a, b) => {
        const aLikes = replyLikes[a._id]?.count ?? a.likes ?? 0;
        const bLikes = replyLikes[b._id]?.count ?? b.likes ?? 0;
        return bLikes - aLikes;
      });
      if (adoptedReply) {
        return [adoptedReply, ...sorted.filter((reply) => reply._id !== adoptedReply._id)];
      }
      return sorted;
    }
    const sorted = list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    if (adoptedReply) {
      return [adoptedReply, ...sorted.filter((reply) => reply._id !== adoptedReply._id)];
    }
    return sorted;
  }, [localReplies, replySort, replyLikes, adoptedReply]);

  const handleSubmitReply = () => {
    const value = replyInput.trim();
    if (!value) return;
    const newReply: Reply = {
      _id: `reply-${Date.now()}`,
      authorId: localUserId,
      author: {
        _id: localUserId,
        nickname: '我',
        avatar: '',
        role: 'member',
        stats: { questionsCount: 0, answersCount: 0, adoptedCount: 0 },
        createdAt: new Date(),
      },
      content: value,
      isAdopted: false,
      likes: 0,
      subReplies: [],
      createdAt: new Date(),
    };
    setLocalReplies((prev) => [...prev, newReply]);
    setReplyLikes((prev) => ({ ...prev, [newReply._id]: { count: 0, liked: false } }));
    setReplyInput('');
    setShowReplyBox(false);
  };

  const handleToggleReplyLike = (replyId: string) => {
    setReplyLikes((prev) => {
      const current = prev[replyId] || { count: 0, liked: false };
      const next = {
        count: current.count + (current.liked ? -1 : 1),
        liked: !current.liked,
      };
      return { ...prev, [replyId]: next };
    });
  };

  const handleToggleComment = (replyId: string) => {
    setCommentOpen((prev) => ({ ...prev, [replyId]: !prev[replyId] }));
  };

  const handleSubmitComment = (replyId: string) => {
    const value = (commentInputs[replyId] || '').trim();
    if (!value) return;
    const newComment: SubReply = {
      _id: `comment-${Date.now()}`,
      authorId: localUserId,
      author: {
        _id: localUserId,
        nickname: '我',
        avatar: '',
        role: 'member',
        stats: { questionsCount: 0, answersCount: 0, adoptedCount: 0 },
        createdAt: new Date(),
      },
      content: value,
      createdAt: new Date(),
    };
    setLocalReplies((prev) =>
      prev.map((reply) =>
        reply._id === replyId
          ? { ...reply, subReplies: [...(reply.subReplies || []), newComment] }
          : reply
      )
    );
    setCommentInputs((prev) => ({ ...prev, [replyId]: '' }));
    setCommentOpen((prev) => ({ ...prev, [replyId]: false }));
  };

  const handleAdoptReply = (replyId: string) => {
    if (!isOwner) return;
    setAdoptedId(replyId);
    setStatus('resolved');
    setLocalReplies((prev) =>
      prev.map((reply) => ({ ...reply, isAdopted: reply._id === replyId }))
    );
  };

  const handleCardClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!onClick) return;
    if (event.target === event.currentTarget) {
      onClick();
    }
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {author.avatar ? (
              <img src={author.avatar} alt={sanitizedNickname} />
            ) : (
              sanitizedNickname.charAt(0)
            )}
          </div>
          <div className={styles.userDetails}>
            <div className={styles.userName}>
              {sanitizedNickname}
              {author.role !== 'member' && (
                <span className={`${styles.roleBadge} ${styles[author.role]}`}>
                  {roleLabels[author.role]}
                </span>
              )}
            </div>
            <div className={styles.userRole}>{categoryLabel}</div>
          </div>
        </div>
        <span className={`${styles.statusBadge} ${styles[status]}`}>
          {status === 'pending' ? '待解决' : '已解决'}
        </span>
      </div>

      <div className={styles.questionBody}>
        <div className={styles.questionMeta}>
          <span className={styles.categoryTag}>{categoryLabel}</span>
          <span className={styles.time}>
            {formatDistanceToNow(new Date(post.createdAt), {
              addSuffix: true,
              locale: zhCN,
            })}
          </span>
        </div>
        <h3 className={styles.title}>{sanitizedTitle}</h3>
        <p className={styles.content}>{sanitizedProblem}</p>
        {sanitizedAttempts && (
          <div className={styles.attempts}>
            <span>补充信息：</span>
            {sanitizedAttempts}
          </div>
        )}
        {adoptedReply && (
          <div className={styles.bestAnswerPreview}>
            <div className={styles.bestAnswerLabel}>最佳回答</div>
            <div className={styles.bestAnswerContent}>{stripEmojis(adoptedReply.content)}</div>
          </div>
        )}
        {post.attachments && post.attachments.length > 0 && (
          <div className={styles.attachmentGrid}>
            {post.attachments.map((attachment, index) => (
              <div key={`${attachment.url}-${index}`} className={styles.attachmentItem}>
                {attachment.type === 'video' ? (
                  <video src={attachment.url} controls />
                ) : (
                  <img src={attachment.url} alt="附件预览" />
                )}
              </div>
            ))}
          </div>
        )}
        {mentionNames.length > 0 && (
          <div className={styles.mentionRow}>
            {mentionNames.map((name) => (
              <span key={name} className={styles.mentionChip}>@{name}</span>
            ))}
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span>回答</span>
            <span>{localReplies.length}</span>
          </span>
          <span className={styles.statItem}>
            <span>浏览</span>
            <span>{post.viewCount}</span>
          </span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.actionButton}
            onClick={() => setShowReplyBox((prev) => !prev)}
            disabled={!canReply}
            title={canReply ? '' : '仅教练可答'}
          >
            回答
          </button>
        </div>
      </div>

      <div className={styles.answerSection}>
        <div className={styles.answerHeader}>
          <span>回答</span>
          <select
            className={styles.replySortSelect}
            value={replySort}
            onChange={(e) => setReplySort(e.target.value as 'latest' | 'likes')}
          >
            <option value="latest">按时间</option>
            <option value="likes">按点赞</option>
          </select>
        </div>

        {showReplyBox && canReply && (
          <div className={styles.answerInput}>
            <textarea
              placeholder="写下你的回答..."
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
            />
            <button onClick={handleSubmitReply}>发布回答</button>
          </div>
        )}

        {sortedReplies.length === 0 ? (
          <div className={styles.emptyState}>
            {canReply ? '暂无回答，欢迎参与' : '暂未开放船员回答'}
          </div>
        ) : (
          <div className={styles.answerList}>
            {sortedReplies.map((reply) => {
              const replyAuthor = reply.author?.nickname || '匿名用户';
              const likeState = replyLikes[reply._id] || { count: reply.likes || 0, liked: false };
              return (
                <div
                  key={reply._id}
                  className={`${styles.answerItem} ${
                    reply.isAdopted || adoptedId === reply._id ? styles.answerBest : ''
                  }`}
                >
                  <div className={styles.answerTop}>
                    <div className={styles.answerAuthor}>{replyAuthor}</div>
                    {(reply.isAdopted || adoptedId === reply._id) && (
                      <span className={styles.bestBadge}>最佳答案</span>
                    )}
                  </div>
                  <div className={styles.answerContent}>{stripEmojis(reply.content)}</div>
                  <div className={styles.answerMeta}>
                    <span>
                      {formatDistanceToNow(new Date(reply.createdAt), {
                        addSuffix: true,
                        locale: zhCN,
                      })}
                    </span>
                    <div className={styles.answerActions}>
                      <button onClick={() => handleToggleReplyLike(reply._id)}>
                        👍 {likeState.count}
                      </button>
                      <button onClick={() => handleToggleComment(reply._id)}>评论</button>
                      {isOwner && !(reply.isAdopted || adoptedId === reply._id) && (
                        <button
                          className={styles.markButton}
                          onClick={() => handleAdoptReply(reply._id)}
                        >
                          标记最佳
                        </button>
                      )}
                    </div>
                  </div>

                  {reply.subReplies && reply.subReplies.length > 0 && (
                    <div className={styles.commentThread}>
                      {reply.subReplies.map((comment) => (
                        <div key={comment._id} className={styles.commentItem}>
                          <span>{comment.author?.nickname || '匿名'}：</span>
                          {stripEmojis(comment.content)}
                        </div>
                      ))}
                    </div>
                  )}

                  {commentOpen[reply._id] && (
                    <div className={styles.commentInputRow}>
                      <input
                        value={commentInputs[reply._id] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [reply._id]: e.target.value }))
                        }
                        placeholder="写下你的评论"
                      />
                      <button onClick={() => handleSubmitComment(reply._id)}>发送</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
