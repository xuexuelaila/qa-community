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
        <div className={styles.dateDisplay} onClick={() => setShowCalendar(true)}>
          <span className={styles.dateText}>
            {startDate && endDate
              ? `${format(startDate, 'MM-dd', { locale: zhCN })} - ${format(endDate, 'MM-dd', {
                  locale: zhCN,
                })}`
              : '日期'}
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
