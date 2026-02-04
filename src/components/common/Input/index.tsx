import React from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
  multiline?: boolean;
  rows?: number;
}

export default function Input({
  label,
  error,
  prefix,
  suffix,
  multiline = false,
  rows = 3,
  className = '',
  ...props
}: InputProps) {
  const inputClasses = [
    styles.input,
    error && styles.error,
    prefix && styles.withPrefix,
    suffix && styles.withSuffix,
    multiline && styles.textarea,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const InputElement = multiline ? 'textarea' : 'input';

  return (
    <div className={styles.inputWrapper}>
      {label && <label className={styles.label}>{label}</label>}
      <div className={styles.inputContainer}>
        {prefix && <span className={styles.prefix}>{prefix}</span>}
        <InputElement
          className={inputClasses}
          rows={multiline ? rows : undefined}
          {...(props as any)}
        />
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
}
