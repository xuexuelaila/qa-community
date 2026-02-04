'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Calendar from '@/components/common/Calendar';
import styles from './DateRangePicker.module.css';

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onRangeChange: (start: Date | null, end: Date | null) => void;
  label?: string;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onRangeChange,
  label = '筛选时间段：',
}: DateRangePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const handleRangeSelect = (start: Date, end: Date) => {
    onRangeChange(start, end);
    setShowCalendar(false);
  };

  const handleClear = () => {
    onRangeChange(null, null);
  };

  const handleToday = () => {
    const today = new Date();
    onRangeChange(today, today);
  };

  return (
    <>
      <div className={styles.filterBar}>
        <div className={styles.label}>
          <span>{label}</span>
        </div>

        <div className={styles.dateRangeBox} onClick={() => setShowCalendar(true)}>
          <span className={`${styles.dateText} ${!startDate ? styles.placeholder : ''}`}>
            {startDate ? format(startDate, 'yyyy-MM-dd', { locale: zhCN }) : '开始日期'}
          </span>
          <span className={styles.separator}>-</span>
          <span className={`${styles.dateText} ${!endDate ? styles.placeholder : ''}`}>
            {endDate ? format(endDate, 'yyyy-MM-dd', { locale: zhCN }) : '结束日期'}
          </span>
        </div>

        <div className={styles.actions}>
          <button className={styles.todayButton} onClick={handleToday}>
            今天
          </button>
          {(startDate || endDate) && (
            <button className={styles.clearButton} onClick={handleClear}>
              清除
            </button>
          )}
        </div>
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
