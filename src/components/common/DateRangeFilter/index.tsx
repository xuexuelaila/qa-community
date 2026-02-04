'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Calendar from '@/components/common/Calendar';
import styles from './DateRangeFilter.module.css';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (start: Date | null, end: Date | null) => void;
}

export default function DateRangeFilter({
  startDate,
  endDate,
  onRangeChange,
}: DateRangeFilterProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleRangeSelect = (start: Date, end: Date) => {
    onRangeChange(start, end);
    setShowCalendar(false);
  };

  const handleClear = () => {
    onRangeChange(null, null);
  };

  return (
    <>
      <div className={styles.filter}>
        <span className={styles.label}>筛选时间段：</span>
        <div className={styles.dateDisplay} onClick={() => setShowCalendar(true)}>
          <span className={styles.dateText}>
            {startDate ? format(startDate, 'yyyy-MM-dd', { locale: zhCN }) : '开始日期'}
          </span>
          <span className={styles.separator}>-</span>
          <span className={styles.dateText}>
            {endDate ? format(endDate, 'yyyy-MM-dd', { locale: zhCN }) : '结束日期'}
          </span>
        </div>
        {(startDate || endDate) && (
          <button className={styles.clearButton} onClick={handleClear}>
            清除
          </button>
        )}
      </div>

      {showCalendar && (
        <Calendar
          startDate={startDate}
          endDate={endDate}
          onRangeSelect={handleRangeSelect}
          onClose={() => setShowCalendar(false)}
          mode="range"
        />
      )}
    </>
  );
}
