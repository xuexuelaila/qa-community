'use client';

import React from 'react';
import styles from './StatusTabs.module.css';

interface StatusTabsProps {
  activeTab: 'all' | 'pending' | 'resolved';
  onTabChange: (tab: 'all' | 'pending' | 'resolved') => void;
  counts?: {
    all: number;
    pending: number;
    resolved: number;
  };
}

export default function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
  const tabs = [
    { key: 'all' as const, label: '全部', count: counts?.all },
    { key: 'pending' as const, label: '待解决', count: counts?.pending },
    { key: 'resolved' as const, label: '已解决', count: counts?.resolved },
  ];

  return (
    <div className={styles.tabs}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`${styles.tab} ${activeTab === tab.key ? styles.active : ''}`}
          onClick={() => onTabChange(tab.key)}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={styles.count}>({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}
