import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Post, Reply, SubReply, Attachment } from '@/types/post';
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

const replyEmojis = [
  '😀','😄','😁','😆','😂','🙂','😉','😊',
  '😍','😘','😋','😜','🤪','🤔','😎','😇',
  '🥳','😴','😮','😥','😅','😤','😠','😐',
  '👍','👏','🙏','💪','🔥','✨','🎉','💡',
  '✅','❗','❓','📌','❤️','💯'
];

const coachMetaByName: Record<string, { specialty: string; adopted: number }> = {
  教练小夏: { specialty: '增长策略', adopted: 18 },
  教练阿北: { specialty: '技术架构', adopted: 15 },
  教练Mia: { specialty: '产品增长', adopted: 12 },
  教练凯文: { specialty: '工程效率', adopted: 9 },
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
  const [previewAttachment, setPreviewAttachment] = useState<{ type: 'image' | 'video'; url: string } | null>(null);
  const [adoptedId, setAdoptedId] = useState<string | null>(
    (post.replies || []).find((reply) => reply.isAdopted)?._id || null
  );
  const [replyAttachments, setReplyAttachments] = useState<Attachment[]>([]);
  const [replyAttachmentError, setReplyAttachmentError] = useState('');
  const replyFileInputRef = useRef<HTMLInputElement | null>(null);
  const [showEmojiPanel, setShowEmojiPanel] = useState(false);
  const emojiPanelRef = useRef<HTMLDivElement | null>(null);
  const emojiButtonRef = useRef<HTMLButtonElement | null>(null);
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

  useEffect(() => {
    if (!previewAttachment) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPreviewAttachment(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewAttachment]);

  const sanitizedTitle = stripEmojis(post.title);
  const sanitizedProblem = stripEmojis(post.content.problem);
  const sanitizedNickname = stripEmojis(author.nickname);
  const sanitizedAttempts = stripEmojis(post.content.attempts);
  const mentionNames = post.mentions || [];
  const adoptedReply =
    localReplies.find((reply) => reply._id === adoptedId) ||
    localReplies.find((reply) => reply.isAdopted);
  const canReply = post.allowReplies !== false;

  const isCoach = (reply: Reply) =>
    reply.author?.role === 'assistant' || reply.author?.role === 'captain';

  const getCoachMeta = (reply: Reply) => {
    const name = reply.author?.nickname || '';
    const preset = coachMetaByName[name];
    if (preset) return preset;
    const adopted = reply.author?.stats?.adoptedCount ?? 0;
    return { specialty: '航海教练', adopted };
  };

  const sortedReplies = useMemo(() => {
    const list = [...localReplies];
    if (replySort === 'likes') {
      const sorted = list.sort((a, b) => {
        const aLikes = replyLikes[a._id]?.count ?? a.likes ?? 0;
        const bLikes = replyLikes[b._id]?.count ?? b.likes ?? 0;
        if (isCoach(a) !== isCoach(b)) return isCoach(a) ? -1 : 1;
        return bLikes - aLikes;
      });
      if (adoptedReply) {
        return [adoptedReply, ...sorted.filter((reply) => reply._id !== adoptedReply._id)];
      }
      return sorted;
    }
    const sorted = list.sort(
      (a, b) => {
        if (isCoach(a) !== isCoach(b)) return isCoach(a) ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    );
    if (adoptedReply) {
      return [adoptedReply, ...sorted.filter((reply) => reply._id !== adoptedReply._id)];
    }
    return sorted;
  }, [localReplies, replySort, replyLikes, adoptedReply]);

  useEffect(() => {
    if (!showReplyBox) {
      if (replyAttachments.length > 0) {
        replyAttachments.forEach((item) => URL.revokeObjectURL(item.url));
      }
      setReplyAttachments([]);
      setReplyAttachmentError('');
    }
  }, [showReplyBox, replyAttachments]);

  useEffect(() => {
    if (!showEmojiPanel) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(target) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(target)
      ) {
        setShowEmojiPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEmojiPanel]);

  const handleInsertEmoji = (emoji: string) => {
    setReplyInput((prev) => `${prev}${emoji}`);
    setShowEmojiPanel(false);
  };

  const appendReplyFiles = (files: File[]) => {
    if (!files.length) return;
    setReplyAttachmentError('');
    const next: Attachment[] = [];
    let imageCount = replyAttachments.length;
    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setReplyAttachmentError('仅支持上传图片');
        return;
      }
      if (imageCount >= 9) {
        setReplyAttachmentError('最多上传 9 张图片');
        return;
      }
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setReplyAttachmentError('单张图片不能超过 10MB');
        return;
      }
      const url = URL.createObjectURL(file);
      next.push({ type: 'image', url });
      imageCount += 1;
    });
    if (next.length > 0) {
      setReplyAttachments((prev) => [...prev, ...next]);
    }
  };

  const handleReplyFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    appendReplyFiles(Array.from(fileList));
  };

  const handleRemoveReplyAttachment = (index: number) => {
    setReplyAttachments((prev) => {
      const item = prev[index];
      if (item) URL.revokeObjectURL(item.url);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  const handleSubmitReply = () => {
    const value = replyInput.trim();
    if (!value && replyAttachments.length === 0) return;
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
      attachments: replyAttachments,
      isAdopted: false,
      likes: 0,
      subReplies: [],
      createdAt: new Date(),
    };
    setLocalReplies((prev) => [...prev, newReply]);
    setReplyLikes((prev) => ({ ...prev, [newReply._id]: { count: 0, liked: false } }));
    setReplyInput('');
    setReplyAttachments([]);
    setReplyAttachmentError('');
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
          </div>
        </div>
        <span className={`${styles.statusBadge} ${styles[status]}`}>
          {status === 'pending' ? '待解决' : '已解决'}
        </span>
      </div>

      <div className={styles.questionBody}>
        <div className={styles.questionMeta}>
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
                <button
                  className={styles.attachmentPreview}
                  onClick={() => setPreviewAttachment(attachment)}
                  type="button"
                >
                  {attachment.type === 'video' ? (
                    <>
                      <video src={attachment.url} muted playsInline />
                      <span className={styles.attachmentPlay}>▶</span>
                    </>
                  ) : (
                    <img src={attachment.url} alt="附件预览" />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
        {previewAttachment && (
          <div
            className={styles.previewBackdrop}
            onClick={() => setPreviewAttachment(null)}
            role="dialog"
            aria-modal="true"
          >
            <div className={styles.previewBody} onClick={(event) => event.stopPropagation()}>
              <button
                className={styles.previewClose}
                onClick={() => setPreviewAttachment(null)}
                aria-label="关闭预览"
              >
                ✕
              </button>
              {previewAttachment.type === 'video' ? (
                <video src={previewAttachment.url} controls autoPlay />
              ) : (
                <img src={previewAttachment.url} alt="附件预览" />
              )}
            </div>
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
            <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 3 7 7h3v8a2 2 0 0 0 4 0V7h3l-5-4Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M5 20h14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            <span>{post.viewCount}</span>
          </span>
          <span className={styles.statItem}>
            <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M8.5 11.5V6.5a3.5 3.5 0 0 1 7 0v5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M6.5 11.5h10l-1.2 7.2a2 2 0 0 1-2 1.8H9.7a2 2 0 0 1-2-1.8l-1.2-7.2Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <span>{post.likes ?? 0}</span>
          </span>
          <span className={styles.statItem}>
            <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M7.5 17.5 4 20V6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v6A2.5 2.5 0 0 1 17.5 15h-8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <span>{localReplies.length}</span>
          </span>
          <span className={styles.statItem}>
            <svg className={styles.statIcon} viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="m12 4 2.5 5 5.5.8-4 3.8.9 5.4L12 16.7 7.1 19l.9-5.4-4-3.8 5.5-.8L12 4Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
            </svg>
            <span>{post.favorites ?? 0}</span>
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
              placeholder="回复…"
              value={replyInput}
              onChange={(e) => setReplyInput(e.target.value)}
              maxLength={1200}
            />
            <input
              ref={replyFileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => handleReplyFiles(e.target.files)}
            />
            <div className={styles.replyFooterRow}>
              <div className={styles.replyTools}>
                <button
                  ref={emojiButtonRef}
                  type="button"
                  className={styles.replyToolBtn}
                  aria-label="表情"
                  onClick={() => setShowEmojiPanel((prev) => !prev)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
                    <circle cx="9" cy="10" r="1" fill="currentColor" />
                    <circle cx="15" cy="10" r="1" fill="currentColor" />
                    <path
                      d="M8.5 14.5c.9 1 2.2 1.6 3.5 1.6s2.6-.6 3.5-1.6"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.replyToolBtn}
                  onClick={() => replyFileInputRef.current?.click()}
                  aria-label="图片"
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <rect
                      x="3.5"
                      y="5.5"
                      width="17"
                      height="13"
                      rx="2"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                    />
                    <circle cx="9" cy="10" r="1.6" fill="currentColor" />
                    <path
                      d="M6.5 16 10.5 12.5 13.5 15 16.5 12 19.5 15.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
                {showEmojiPanel && (
                  <div className={styles.emojiPanel} ref={emojiPanelRef}>
                    {replyEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className={styles.emojiButton}
                        onClick={() => handleInsertEmoji(emoji)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
                <span className={styles.replyUploadTip}>{replyAttachments.length}/9</span>
              </div>
              <div className={styles.replyMeta}>
                <span className={styles.replyCount}>{replyInput.length}/1200</span>
                <button className={styles.replySubmit} onClick={handleSubmitReply}>
                  发布
                </button>
              </div>
            </div>
            {replyAttachmentError && (
              <div className={styles.replyUploadError}>{replyAttachmentError}</div>
            )}
            {replyAttachments.length > 0 && (
              <div className={styles.replyAttachmentGrid}>
                {replyAttachments.map((item, index) => (
                  <div key={`${item.url}-${index}`} className={styles.replyAttachmentItem}>
                    <button
                      type="button"
                      className={styles.replyAttachmentPreview}
                      onClick={() => setPreviewAttachment(item)}
                    >
                      <img src={item.url} alt="附件预览" />
                    </button>
                    <button
                      type="button"
                      className={styles.replyAttachmentRemove}
                      onClick={() => handleRemoveReplyAttachment(index)}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              const coachMeta = getCoachMeta(reply);
              const coachAnswer = isCoach(reply);
              return (
                <div
                  key={reply._id}
                  className={`${styles.answerItem} ${coachAnswer ? styles.answerCoach : ''} ${
                    reply.isAdopted || adoptedId === reply._id ? styles.answerBest : ''
                  }`}
                >
                  <div className={styles.answerTop}>
                    <div className={styles.answerAuthorRow}>
                      <div
                        className={`${styles.answerAvatar} ${
                          coachAnswer ? styles.answerAvatarCoach : ''
                        }`}
                      >
                        {replyAuthor.charAt(0)}
                      </div>
                      <div className={styles.answerAuthor}>
                        {replyAuthor}
                        {coachAnswer ? (
                          <span className={styles.coachBadge}>教练</span>
                        ) : (
                          <span className={styles.memberBadge}>圈友</span>
                        )}
                      </div>
                    </div>
                    {(reply.isAdopted || adoptedId === reply._id) && (
                      <span className={styles.bestBadge}>
                        {coachAnswer ? '最佳答案 · 教练解答' : '最佳答案'}
                      </span>
                    )}
                  </div>
                  {coachAnswer && coachMeta && (
                    <div className={styles.coachMeta}>
                      擅长：{coachMeta.specialty} · 被采纳 {coachMeta.adopted}
                    </div>
                  )}
                  <div className={styles.answerContent}>{stripEmojis(reply.content)}</div>
                  {reply.attachments && reply.attachments.length > 0 && (
                    <div className={styles.attachmentGrid}>
                      {reply.attachments.map((attachment, index) => (
                        <div key={`${attachment.url}-${index}`} className={styles.attachmentItem}>
                          <button
                            className={styles.attachmentPreview}
                            onClick={() => setPreviewAttachment(attachment)}
                            type="button"
                          >
                            <img src={attachment.url} alt="附件预览" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
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
