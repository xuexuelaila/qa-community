'use client';

import React from 'react';
import styles from './MainTabs.module.css';

interface MainTabsProps {
  activeTab: 'log' | 'community';
  onTabChange: (tab: 'log' | 'community') => void;
}

export default function MainTabs({ activeTab, onTabChange }: MainTabsProps) {
  return (
    <div className={styles.tabs}>
      <button
        className={`${styles.tab} ${activeTab === 'log' ? styles.active : ''}`}
        onClick={() => onTabChange('log')}
      >
        航海日志
      </button>
      <button
        className={`${styles.tab} ${activeTab === 'community' ? styles.active : ''}`}
        onClick={() => onTabChange('community')}
      >
        求助站
      </button>
    </div>
  );
}
