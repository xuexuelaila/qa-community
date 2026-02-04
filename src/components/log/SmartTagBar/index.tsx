'use client';

import React, { useState } from 'react';
import { TAG_CATEGORIES, groupTagsByCategory, getHotTags } from '@/lib/tagCategories';
import { stripEmojis } from '@/lib/text';
import styles from './SmartTagBar.module.css';

interface SmartTagBarProps {
  allTags: string[];
  selectedTags: string[];
  onTagClick: (tag: string) => void;
  onClearAll?: () => void;
  tagClickCounts?: Record<string, number>;
}

export default function SmartTagBar({
  allTags,
  selectedTags,
  onTagClick,
  onClearAll,
  tagClickCounts = {},
}: SmartTagBarProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showAllTags, setShowAllTags] = useState(false);

  // 获取今日热词（前8个）
  const hotTags = getHotTags(allTags, tagClickCounts, 8);

  // 按分类分组
  const groupedTags = groupTagsByCategory(allTags);

  // 切换分类展开/收起
  const toggleCategory = (categoryKey: string) => {
    setExpandedCategory(expandedCategory === categoryKey ? null : categoryKey);
  };

  // 清除所有筛选
  const handleClearAll = () => {
    setExpandedCategory(null);
    if (onClearAll) {
      onClearAll();
    }
  };

  return (
    <div className={styles.container}>
      {/* 一级分类 */}
      <div className={styles.categoryBar}>
        <div className={styles.categoryScroll}>
          {/* 全部按钮 */}
          <button
            className={`${styles.categoryButton} ${styles.allButton} ${
              selectedTags.length === 0 && !expandedCategory ? styles.active : ''
            }`}
            onClick={handleClearAll}
          >
            <span className={styles.categoryName}>全部</span>
            <span className={styles.categoryCount}>({allTags.length})</span>
          </button>

          {Object.entries(TAG_CATEGORIES).map(([key, category]) => {
            const categoryTags = groupedTags[key] || [];
            if (categoryTags.length === 0) return null;

            const isActive = expandedCategory === key;
            const hasSelected = categoryTags.some(tag => selectedTags.includes(tag));

            return (
              <button
                key={key}
                className={`${styles.categoryButton} ${isActive ? styles.active : ''} ${
                  hasSelected ? styles.hasSelected : ''
                }`}
                onClick={() => toggleCategory(key)}
                style={{ '--category-color': category.color } as React.CSSProperties}
              >
                <span className={styles.categoryName}>{stripEmojis(category.name)}</span>
                <span className={styles.categoryCount}>({categoryTags.length})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 二级标签（展开时显示） */}
      {expandedCategory && (
        <div className={styles.tagPanel}>
          <div className={styles.tagPanelHeader}>
            <span className={styles.tagPanelTitle}>
              {stripEmojis(
                TAG_CATEGORIES[expandedCategory as keyof typeof TAG_CATEGORIES]?.name || ''
              )}
            </span>
            <button className={styles.closeButton} onClick={() => setExpandedCategory(null)}>
              收起 ✕
            </button>
          </div>
          <div className={styles.tagScroll}>
            {(groupedTags[expandedCategory] || []).map((tag) => (
              <button
                key={tag}
                className={`${styles.tag} ${selectedTags.includes(tag) ? styles.selected : ''}`}
                onClick={() => onTagClick(tag)}
              >
                {stripEmojis(tag)}
                {tagClickCounts[tag] > 0 && (
                  <span className={styles.tagHot}>{tagClickCounts[tag]}</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 今日热词 */}
      {!expandedCategory && (
        <div className={styles.hotTagsSection}>
          <div className={styles.hotTagsHeader}>
            <span className={styles.hotTagsTitle}>今日热词</span>
            <button className={styles.moreButton} onClick={() => setShowAllTags(true)}>
              更多筛选 →
            </button>
          </div>
          <div className={styles.hotTagsScroll}>
            {hotTags.map((tag) => (
              <button
                key={tag}
                className={`${styles.hotTag} ${selectedTags.includes(tag) ? styles.selected : ''}`}
                onClick={() => onTagClick(tag)}
              >
                {stripEmojis(tag)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 全部标签抽屉 */}
      {showAllTags && (
        <div className={styles.drawer} onClick={() => setShowAllTags(false)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <h3>全部标签</h3>
              <button className={styles.closeButton} onClick={() => setShowAllTags(false)}>
                ✕
              </button>
            </div>
            <div className={styles.drawerBody}>
              {Object.entries(TAG_CATEGORIES).map(([key, category]) => {
                const categoryTags = groupedTags[key] || [];
                if (categoryTags.length === 0) return null;

                return (
                  <div key={key} className={styles.drawerCategory}>
                    <h4 className={styles.drawerCategoryTitle}>
                      <span>{stripEmojis(category.name)}</span>
                      <span className={styles.drawerCategoryCount}>({categoryTags.length})</span>
                    </h4>
                    <div className={styles.drawerTags}>
                      {categoryTags.map((tag) => (
                        <button
                          key={tag}
                          className={`${styles.drawerTag} ${
                            selectedTags.includes(tag) ? styles.selected : ''
                          }`}
                          onClick={() => {
                            onTagClick(tag);
                            setShowAllTags(false);
                          }}
                        >
                          {stripEmojis(tag)}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
