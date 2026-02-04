'use client';

import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  isWithinInterval,
  startOfDay,
  endOfDay,
  subDays,
  startOfQuarter,
  subQuarters,
} from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Button from '@/components/common/Button';
import styles from './Calendar.module.css';

interface CalendarProps {
  selectedDate?: Date;
  startDate?: Date;
  endDate?: Date;
  onSelect?: (date: Date) => void;
  onRangeSelect?: (start: Date, end: Date) => void;
  onClose: () => void;
  datesWithContent?: Date[];
  mode?: 'single' | 'range';
}

export default function Calendar({
  selectedDate,
  startDate: initialStartDate,
  endDate: initialEndDate,
  onSelect,
  onRangeSelect,
  onClose,
  datesWithContent = [],
  mode = 'single',
}: CalendarProps) {
  const [currentMonth1, setCurrentMonth1] = useState(new Date());
  const [currentMonth2, setCurrentMonth2] = useState(addMonths(new Date(), 1));
  const [rangeStart, setRangeStart] = useState<Date | null>(initialStartDate || null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(initialEndDate || null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  const shortcuts = [
    { label: '今天', getValue: () => ({ start: new Date(), end: new Date() }) },
    { label: '昨天', getValue: () => ({ start: subDays(new Date(), 1), end: subDays(new Date(), 1) }) },
    {
      label: '最近7天',
      getValue: () => ({ start: subDays(new Date(), 6), end: new Date() }),
    },
    {
      label: '这个月',
      getValue: () => ({ start: startOfMonth(new Date()), end: new Date() }),
    },
    {
      label: '上个月',
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      },
    },
    {
      label: '上个季度',
      getValue: () => {
        const lastQuarter = subQuarters(new Date(), 1);
        return { start: startOfQuarter(lastQuarter), end: endOfMonth(addMonths(startOfQuarter(lastQuarter), 2)) };
      },
    },
  ];

  const getDaysInMonth = (date: Date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = startOfWeek(monthStart, { locale: zhCN });
    const endDate = endOfWeek(monthEnd, { locale: zhCN });

    const days: Date[] = [];
    let currentDate = startDate;

    while (currentDate <= endDate) {
      days.push(currentDate);
      currentDate = addDays(currentDate, 1);
    }

    return days;
  };

  const hasContent = (date: Date) => {
    return datesWithContent.some((d) => isSameDay(d, date));
  };

  const isInRange = (date: Date) => {
    if (!rangeStart || !rangeEnd) {
      if (rangeStart && hoverDate) {
        const start = rangeStart < hoverDate ? rangeStart : hoverDate;
        const end = rangeStart < hoverDate ? hoverDate : rangeStart;
        return isWithinInterval(date, { start, end });
      }
      return false;
    }
    return isWithinInterval(date, { start: rangeStart, end: rangeEnd });
  };

  const isSelected = (date: Date) => {
    if (mode === 'single') {
      return selectedDate ? isSameDay(date, selectedDate) : false;
    }
    return (rangeStart && isSameDay(date, rangeStart)) || (rangeEnd && isSameDay(date, rangeEnd));
  };

  const handleDayClick = (date: Date) => {
    if (mode === 'single') {
      onSelect?.(date);
      onClose();
    } else {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        setRangeStart(date);
        setRangeEnd(null);
      } else {
        if (date < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(date);
        } else {
          setRangeEnd(date);
        }
      }
    }
  };

  const handleShortcut = (shortcut: any) => {
    const { start, end } = shortcut.getValue();
    setRangeStart(start);
    setRangeEnd(end);
  };

  const handleConfirm = () => {
    if (mode === 'range' && rangeStart && rangeEnd) {
      onRangeSelect?.(rangeStart, rangeEnd);
    }
    onClose();
  };

  const handlePrevMonth = () => {
    setCurrentMonth1(subMonths(currentMonth1, 1));
    setCurrentMonth2(subMonths(currentMonth2, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth1(addMonths(currentMonth1, 1));
    setCurrentMonth2(addMonths(currentMonth2, 1));
  };

  const renderMonth = (currentMonth: Date) => {
    const days = getDaysInMonth(currentMonth);

    return (
      <div className={styles.monthView}>
        <div className={styles.monthHeader}>
          <button className={styles.navButton} onClick={handlePrevMonth}>
            ‹
          </button>
          <span className={styles.monthTitle}>
            {format(currentMonth, 'yyyy-MM', { locale: zhCN })}
          </span>
          <button className={styles.navButton} onClick={handleNextMonth}>
            ›
          </button>
        </div>

        <div className={styles.weekdays}>
          {weekDays.map((day) => (
            <div key={day} className={styles.weekday}>
              {day}
            </div>
          ))}
        </div>

        <div className={styles.days}>
          {days.map((day, index) => {
            const isOtherMonth = !isSameMonth(day, currentMonth);
            const isDaySelected = isSelected(day);
            const isDayInRange = isInRange(day);
            const isDayToday = isToday(day);
            const hasDayContent = hasContent(day);

            return (
              <button
                key={index}
                className={`${styles.day} ${isOtherMonth ? styles.otherMonth : ''} ${
                  isDaySelected ? styles.selected : ''
                } ${isDayInRange ? styles.inRange : ''} ${isDayToday ? styles.today : ''} ${
                  hasDayContent ? styles.hasContent : ''
                }`}
                onClick={() => handleDayClick(day)}
                onMouseEnter={() => mode === 'range' && setHoverDate(day)}
                onMouseLeave={() => mode === 'range' && setHoverDate(null)}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.calendar}>
        <div className={styles.header}>
          <h2 className={styles.title}>选择日期</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>

        {mode === 'range' && (
          <>
            <div className={styles.dateRangeDisplay}>
              <input
                type="text"
                className={styles.dateInput}
                value={rangeStart ? format(rangeStart, 'yyyy-MM-dd') : ''}
                readOnly
                placeholder="开始日期"
              />
              <span className={styles.separator}>-</span>
              <input
                type="text"
                className={styles.dateInput}
                value={rangeEnd ? format(rangeEnd, 'yyyy-MM-dd') : ''}
                readOnly
                placeholder="结束日期"
              />
            </div>

            <div className={styles.shortcuts}>
              {shortcuts.map((shortcut) => (
                <button
                  key={shortcut.label}
                  className={styles.shortcutButton}
                  onClick={() => handleShortcut(shortcut)}
                >
                  {shortcut.label}
                </button>
              ))}
            </div>
          </>
        )}

        <div className={styles.monthsContainer}>
          {renderMonth(currentMonth1)}
          {renderMonth(currentMonth2)}
        </div>

        <div className={styles.footer}>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button variant="primary" onClick={handleConfirm}>
            确定
          </Button>
        </div>
      </div>
    </>
  );
}
