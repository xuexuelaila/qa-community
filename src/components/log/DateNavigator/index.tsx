'use client';

import React, { useEffect, useRef, useState } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Calendar from '@/components/common/Calendar';
import styles from './DateNavigator.module.css';

interface DateNavigatorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  datesWithContent?: Date[];
}

export default function DateNavigator({
  selectedDate,
  onDateChange,
  datesWithContent = [],
}: DateNavigatorProps) {
  const [dates, setDates] = useState<Date[]>([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const generateDates = () => {
      const result: Date[] = [];
      for (let i = -30; i <= 30; i++) {
        result.push(addDays(new Date(), i));
      }
      return result;
    };

    setDates(generateDates());
  }, []);

  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      const container = listRef.current;
      const selected = selectedRef.current;
      const scrollLeft = selected.offsetLeft - container.offsetWidth / 2 + selected.offsetWidth / 2;
      container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  }, [selectedDate]);

  const hasContent = (date: Date) => {
    return datesWithContent.some((d) => isSameDay(d, date));
  };

  const handleCalendarSelect = (date: Date) => {
    onDateChange(date);
    setShowCalendar(false);
  };

  return (
    <>
      <div className={styles.navigator}>
        <div ref={listRef} className={styles.dateList}>
          {dates.map((date, index) => {
            const isActive = isSameDay(date, selectedDate);
            return (
              <div
                key={index}
                ref={isActive ? selectedRef : null}
                className={`${styles.dateItem} ${isActive ? styles.active : ''}`}
                onClick={() => onDateChange(date)}
              >
                <span className={styles.weekday}>
                  {format(date, 'EEE', { locale: zhCN })}
                </span>
                <span className={styles.day}>{format(date, 'd')}</span>
                {hasContent(date) && <span className={styles.dot} />}
              </div>
            );
          })}
        </div>
        <button
          className={styles.calendarButton}
          onClick={() => setShowCalendar(true)}
          aria-label="Open calendar"
        >
          日历
        </button>
      </div>

      {showCalendar && (
        <Calendar
          selectedDate={selectedDate}
          onSelect={handleCalendarSelect}
          onClose={() => setShowCalendar(false)}
          datesWithContent={datesWithContent}
          mode="single"
        />
      )}
    </>
  );
}
