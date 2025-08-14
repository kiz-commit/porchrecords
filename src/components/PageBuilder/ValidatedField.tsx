"use client";

import React from 'react';
import { ValidationError } from '@/lib/validation';

interface ValidatedFieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  type?: 'text' | 'textarea' | 'email' | 'url' | 'number';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  minLength?: number;
  errors?: ValidationError[];
  className?: string;
  disabled?: boolean;
}

export default function ValidatedField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  required = false,
  maxLength,
  minLength,
  errors = [],
  className = '',
  disabled = false
}: ValidatedFieldProps) {
  const fieldErrors = errors.filter(error => error.field === name);
  const hasError = fieldErrors.length > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const inputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    ${hasError 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${className}
  `;

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          disabled={disabled}
          rows={4}
          className={inputClasses}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          maxLength={maxLength}
          minLength={minLength}
          disabled={disabled}
          className={inputClasses}
        />
      )}

      {hasError && (
        <div className="mt-1">
          {fieldErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error.message}
            </p>
          ))}
        </div>
      )}

      {maxLength && (
        <div className="mt-1 text-xs text-gray-500">
          {value.length}/{maxLength} characters
        </div>
      )}
    </div>
  );
} 