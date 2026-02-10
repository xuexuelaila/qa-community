'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { QAKnowledge } from '@/types/qa';
import { stripEmojis } from '@/lib/text';
import styles from './QACard.module.css';

interface QACardProps {
  qa: QAKnowledge;
  onFeedback?: (qaId: string, type: 'useful' | 'useless') => void;
  onClick?: (target?: 'top' | 'comments') => void;
}

interface ExtractedLink {
  url: string;
  text: string;
  type: 'tool' | 'link';
}

const categoryNames = {
  practical: '实操技巧',
  pitfall: '避坑指南',
  logic: '底层逻辑',
};

// 工具关键词列表
const toolKeywords = ['工具', '软件', '插件', '平台', '网站', 'App', '应用'];

export default function QACard({ qa, onClick }: QACardProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleCardClick = () => {
    onClick?.('top');
  };

  const dedupeMarkdownLines = (text: string): string => {
    const lines = text.split('\n');
    const output: string[] = [];
    let prevKey = '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        output.push(line);
        prevKey = '';
        continue;
      }
      const key = trimmed.replace(/^[-*\\d\\.]+\\s*/, '').toLowerCase();
      if (key && key === prevKey) {
        continue;
      }
      output.push(line);
      prevKey = key;
    }
    return output.join('\n');
  };

  // 提取链接和工具
  const extractLinks = (text: string): ExtractedLink[] => {
    const links: ExtractedLink[] = [];

    // 提取URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex) || [];

    urls.forEach(url => {
      // 判断是否是工具链接
      const isTool = toolKeywords.some(keyword =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      links.push({
        url,
        text: url.length > 40 ? url.substring(0, 40) + '...' : url,
        type: isTool ? 'tool' : 'link'
      });
    });

    return links;
  };

  // 提取图片URL (假设从attachments或内容中提取)
  const extractImages = (): string[] => {
    // 这里可以从qa.attachments或其他字段提取
    // 暂时返回空数组,后续可以扩展
    return [];
  };

  const safeAnswer = qa.answer ?? '';
  const safeQuestion = qa.question ?? '';
  const sanitizedAnswer = dedupeMarkdownLines(stripEmojis(safeAnswer));
  const sanitizedQuestion = stripEmojis(safeQuestion);
  const links = extractLinks(sanitizedAnswer);
  const images = extractImages();
  const isLongAnswer = sanitizedAnswer.length > 160 || sanitizedAnswer.split('\n').length > 4;

  return (
    <div className={styles.card} onClick={handleCardClick}>
      {/* 分类标签 - 右上角 */}
      <div className={styles.categoryBadge}>
        {categoryNames[qa.category]}
      </div>

      {/* 标题区 */}
      <div className={styles.header}>
        <div className={styles.qaBadge}>问</div>
        <h3 className={styles.questionText}>{sanitizedQuestion}</h3>
      </div>

      {/* 答案内容 */}
      <div className={`${styles.answer} ${isLongAnswer ? styles.answerOverflow : ''}`}>
        <div className={styles.answerContent}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              // 自定义渲染,移除视觉上的Markdown标识
              strong: ({ children, ...props }) => <span className={styles.bold} {...props}>{children}</span>,
              em: ({ children, ...props }) => <span className={styles.emphasis} {...props}>{children}</span>,
              a: ({ href, children, ...props }) => (
                <a href={href} className={styles.link} onClick={(e) => e.stopPropagation()} {...props}>
                  {children}
                </a>
              ),
            }}
          >
            {sanitizedAnswer}
          </ReactMarkdown>
        </div>
      </div>

      {isLongAnswer && (
        <div className={styles.moreHint}>内容较长，查看详情</div>
      )}

      {/* 工具/链接导航区 */}
      {links.length > 0 && (
        <div className={styles.linksSection}>
          <div className={styles.linksSectionTitle}>
            <span>相关链接</span>
          </div>
          <div className={styles.linksGrid}>
            {links.map((link, index) => {
              const displayLinkText = stripEmojis(link.text);
              return (
                <a
                  key={index}
                  href={link.url}
                  className={`${styles.linkPill} ${link.type === 'tool' ? styles.toolPill : ''}`}
                  onClick={(e) => e.stopPropagation()}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className={styles.linkIcon}>{link.type === 'tool' ? '工具' : '链接'}</span>
                  <span className={styles.linkText}>{displayLinkText}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* 图片缩略图展示区 */}
      {images.length > 0 && (
        <div className={styles.imagesSection}>
          <div className={styles.imagesSectionTitle}>
            <span>相关图片</span>
          </div>
          <div className={styles.imagesGrid}>
            {images.map((image, index) => (
              <div
                key={index}
                className={styles.imageThumbnail}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImage(image);
                }}
              >
                <img src={image} alt={`图片 ${index + 1}`} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部互动区 */}
      <div className={styles.footer}>
        <div className={styles.detailRow}>
          <button
            className={styles.detailButton}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.('comments');
            }}
          >
            查看详细
          </button>
        </div>
      </div>

      {/* 图片全屏预览 */}
      {selectedImage && (
        <div
          className={styles.imageModal}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImage(null);
          }}
        >
          <div className={styles.imageModalContent}>
            <img src={selectedImage} alt="预览" />
            <button className={styles.closeModal}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
