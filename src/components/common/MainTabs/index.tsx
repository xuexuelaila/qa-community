'use client';

import React from 'react';
import styles from './MainTabs.module.css';

interface MainTabsProps {
  activeTab: 'log' | 'community';
  onTabChange: (tab: 'log' | 'community') => void;
  variant?: 'default' | 'embedded';
}

export default function MainTabs({ activeTab, onTabChange, variant = 'default' }: MainTabsProps) {
  const tabs = [
    { key: 'log' as const, label: '百问百答' },
    { key: 'community' as const, label: '社区问答' },
  ];

  return (
    <div className={`${styles.tabs} ${variant === 'embedded' ? styles.embedded : ''}`}>
      <div className={styles.tabRow}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => onTabChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
