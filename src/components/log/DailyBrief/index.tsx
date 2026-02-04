'use client';

import React, { useState } from 'react';
import { DailyBrief as DailyBriefType } from '@/types/qa';
import { stripEmojis } from '@/lib/text';
import styles from './DailyBrief.module.css';

interface DailyBriefProps {
  brief: DailyBriefType;
}

export default function DailyBrief({ brief }: DailyBriefProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={styles.brief}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <span>今日概览</span>
        </h2>
        <button
          className={styles.toggleButton}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? '收起' : '展开'}
        </button>
      </div>
      <div className={`${styles.content} ${isExpanded ? styles.expanded : styles.collapsed}`}>
        <div className={styles.stats}>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>问题数</span>
            <span className={styles.statValue}>{brief.totalQuestions}</span>
          </div>
          <div className={styles.statItem}>
            <span className={styles.statLabel}>回答数</span>
            <span className={styles.statValue}>{brief.totalAnswers}</span>
          </div>
        </div>
        <p className={styles.summary}>{stripEmojis(brief.summary)}</p>
        <div className={styles.tags}>
          {brief.topTags.map((tag, index) => (
            <span key={index} className={styles.tag}>
              {stripEmojis(tag)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
