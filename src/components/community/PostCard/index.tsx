import React from 'react';
import { Post } from '@/types/post';
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

export default function PostCard({ post, onClick }: PostCardProps) {
  const author = post.author || {
    nickname: '匿名用户',
    role: 'member' as const,
    avatar: '',
  };

  const sanitizedTitle = stripEmojis(post.title);
  const sanitizedProblem = stripEmojis(post.content.problem);
  const sanitizedStage = stripEmojis(post.content.stage);
  const sanitizedNickname = stripEmojis(author.nickname);

  return (
    <div className={styles.card} onClick={onClick}>
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
            <div className={styles.userRole}>{sanitizedStage}</div>
          </div>
        </div>
        <span className={`${styles.statusBadge} ${styles[post.status]}`}>
          {post.status === 'pending' ? '待解决' : '已解决'}
        </span>
      </div>

      <h3 className={styles.title}>{sanitizedTitle}</h3>
      <p className={styles.content}>{sanitizedProblem}</p>

      <div className={styles.footer}>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span>回复</span>
            <span>{post.replies.length}</span>
          </span>
          <span className={styles.statItem}>
            <span>浏览</span>
            <span>{post.viewCount}</span>
          </span>
        </div>
        <span className={styles.time}>
          {formatDistanceToNow(new Date(post.createdAt), {
            addSuffix: true,
            locale: zhCN,
          })}
        </span>
      </div>
    </div>
  );
}
