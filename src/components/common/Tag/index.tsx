import React from 'react';
import styles from './Tag.module.css';

interface TagProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning';
  clickable?: boolean;
  active?: boolean;
  onClose?: () => void;
  onClick?: () => void;
  className?: string;
}

export default function Tag({
  children,
  variant = 'default',
  clickable = false,
  active = false,
  onClose,
  onClick,
  className = '',
}: TagProps) {
  const tagClasses = [
    styles.tag,
    styles[variant],
    clickable && styles.clickable,
    active && styles.active,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={tagClasses} onClick={onClick}>
      {children}
      {onClose && (
        <button
          className={styles.closeButton}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}
