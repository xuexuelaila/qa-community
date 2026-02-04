import React from 'react';
import styles from './Card.module.css';

interface CardProps {
  children: React.ReactNode;
  clickable?: boolean;
  onClick?: () => void;
  className?: string;
}

interface CardSubComponents {
  Header: React.FC<{ children: React.ReactNode; className?: string }>;
  Body: React.FC<{ children: React.ReactNode; className?: string }>;
  Footer: React.FC<{ children: React.ReactNode; className?: string }>;
}

const Card: React.FC<CardProps> & CardSubComponents = ({
  children,
  clickable = false,
  onClick,
  className = '',
}) => {
  const cardClasses = [
    styles.card,
    clickable && styles.clickable,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cardClasses} onClick={onClick}>
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={`${styles.header} ${className}`}>{children}</div>
);

Card.Body = ({ children, className = '' }) => (
  <div className={`${styles.body} ${className}`}>{children}</div>
);

Card.Footer = ({ children, className = '' }) => (
  <div className={`${styles.footer} ${className}`}>{children}</div>
);

export default Card;
