import React, { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from './icons';

interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'right';
  width?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Dropdown: React.FC<DropdownProps> = ({ 
  trigger, 
  children, 
  className = '', 
  align = 'left',
  width = 'md' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const widthClasses = {
    sm: 'w-32',
    md: 'w-48',
    lg: 'w-64',
    xl: 'w-80'
  };

  const alignClasses = {
    left: 'left-0',
    right: 'right-0'
  };

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
        type="button"
      >
        {trigger}
        <ChevronDownIcon 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className={`absolute z-50 mt-2 ${widthClasses[width]} ${alignClasses[align]} bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none`}>
          <div className="py-1">
            {children}
          </div>
        </div>
      )}
    </div>
  );
};

interface DropdownItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  icon?: React.ReactNode;
}

export const DropdownItem: React.FC<DropdownItemProps> = ({ 
  children, 
  onClick, 
  href, 
  className = '',
  icon 
}) => {
  const baseClasses = "flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors duration-200";
  
  if (href) {
    return (
      <a 
        href={href} 
        className={`${baseClasses} ${className}`}
      >
        {icon && <span className="mr-3">{icon}</span>}
        {children}
      </a>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${className}`}
      type="button"
    >
      {icon && <span className="mr-3">{icon}</span>}
      {children}
    </button>
  );
};

export const DropdownDivider: React.FC = () => (
  <div className="border-t border-gray-100 my-1" />
);
