import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-100 shadow-sm ${hover ? 'hover:shadow-lg transition-all duration-300 hover:-translate-y-1' : ''} ${className}`}
    >
      {children}
    </div>
  );
};