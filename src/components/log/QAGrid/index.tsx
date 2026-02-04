import React from 'react';
import styles from './QAGrid.module.css';

interface QAGridProps {
  children: React.ReactNode;
}

export default function QAGrid({ children }: QAGridProps) {
  return <div className={styles.grid}>{children}</div>;
}
