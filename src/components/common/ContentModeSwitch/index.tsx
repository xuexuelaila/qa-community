'use client';

import React from 'react';
import styles from './ContentModeSwitch.module.css';

type ContentMode = 'log' | 'community';

interface ContentModeSwitchProps {
  value: ContentMode;
  onChange: (value: ContentMode) => void;
}

export default function ContentModeSwitch({ value, onChange }: ContentModeSwitchProps) {
  return (
    <div className={styles.switch} role="tablist" aria-label="内容模式切换">
      <button
        type="button"
        role="tab"
        aria-selected={value === 'log'}
        className={`${styles.item} ${value === 'log' ? styles.active : ''}`}
        onClick={() => onChange('log')}
      >
        百问百答
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === 'community'}
        className={`${styles.item} ${value === 'community' ? styles.active : ''}`}
        onClick={() => onChange('community')}
      >
        社区问答
      </button>
    </div>
  );
}
