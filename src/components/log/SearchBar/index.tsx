'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Tag from '@/components/common/Tag';
import { stripEmojis } from '@/lib/text';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onTagClick: (tag: string) => void;
  tags?: string[];
  selectedTags?: string[];
}

export default function SearchBar({
  onSearch,
  onTagClick,
  tags = [],
  selectedTags = [],
}: SearchBarProps) {
  const [keyword, setKeyword] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const debounce = <T extends (...args: any[]) => any>(func: T, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      onSearch(value);
      if (value.length > 0) {
        const filtered = tags.filter((tag) =>
          stripEmojis(tag).toLowerCase().includes(value.toLowerCase())
        );
        setSuggestions(filtered.slice(0, 5));
        setShowSuggestions(filtered.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, 300),
    [tags, onSearch]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setKeyword(value);
    debouncedSearch(value);
  };

  const handleSuggestionClick = (suggestion: string) => {
    const sanitized = stripEmojis(suggestion);
    setKeyword(sanitized);
    onSearch(sanitized);
    setShowSuggestions(false);
  };

  return (
    <div className={styles.searchBar}>
      <div className={styles.searchInput}>
        <input
          type="text"
          className={styles.input}
          placeholder="搜索问题、答案或标签..."
          value={keyword}
          onChange={handleInputChange}
          onFocus={() => keyword.length > 0 && setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className={styles.suggestions}>
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={styles.suggestionItem}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {stripEmojis(suggestion)}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className={styles.tagCloud}>
        {tags.map((tag, index) => {
          const displayTag = stripEmojis(tag);
          return (
            <Tag
              key={index}
              variant="primary"
              clickable
              active={selectedTags.includes(tag)}
              onClick={() => onTagClick(tag)}
            >
              {displayTag}
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
