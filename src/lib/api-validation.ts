import { NextRequest, NextResponse } from 'next/server';
import { PageContent, PageSection, MediaItem } from '@/lib/types';

// Validation error types
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Page validation schema
export const pageValidationSchema = {
  id: { required: true, type: 'string', minLength: 1 },
  title: { required: true, type: 'string', minLength: 1, maxLength: 200 },
  slug: { required: true, type: 'string', minLength: 1, maxLength: 100, pattern: /^[a-z0-9-]+$/ },
  description: { required: false, type: 'string', maxLength: 500 },
  metaTitle: { required: false, type: 'string', maxLength: 60 },
  metaDescription: { required: false, type: 'string', maxLength: 160 },
  isPublished: { required: false, type: 'boolean' },
  isDraft: { required: false, type: 'boolean' },
  sections: { required: true, type: 'array' },
  versions: { required: false, type: 'array' },
  template: { required: false, type: 'string' },
  tags: { required: false, type: 'array' },
  publishAt: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/ },
  unpublishAt: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/ },
  clonedFrom: { required: false, type: 'string' },
  createdAt: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/ },
  lastModified: { required: false, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/ }
};

// Section validation schema
export const sectionValidationSchema = {
  id: { required: true, type: 'string', minLength: 1 },
  type: { required: true, type: 'string', minLength: 1 },
  title: { required: true, type: 'string', minLength: 1 },
  content: { required: true, type: 'string' },
  order: { required: true, type: 'number', min: 0 },
  isVisible: { required: false, type: 'boolean' },
  config: { required: false, type: 'object' },
  createdAt: { required: false, type: 'string' },
  updatedAt: { required: false, type: 'string' }
};

// Media validation schema
export const mediaValidationSchema = {
  id: { required: true, type: 'string', minLength: 1 },
  name: { required: true, type: 'string', minLength: 1, maxLength: 255 },
  type: { required: true, type: 'string', enum: ['image', 'video', 'audio', 'document'] },
  url: { required: true, type: 'string', minLength: 1 },
  thumbnail: { required: false, type: 'string' },
  size: { required: false, type: 'number', min: 0 },
  dimensions: { required: false, type: 'object' },
  uploadedAt: { required: true, type: 'string', pattern: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/ },
  tags: { required: false, type: 'array' },
  category: { required: false, type: 'string' }
};

// Generic validation function
export function validateField(
  value: any,
  fieldName: string,
  schema: any
): ValidationError[] {
  const errors: ValidationError[] = [];
  const fieldSchema = schema[fieldName];

  if (!fieldSchema) {
    return errors; // No validation rules for this field
  }

  // Check if required
  if (fieldSchema.required && (value === undefined || value === null || value === '')) {
    errors.push({
      field: fieldName,
      message: `${fieldName} is required`,
      code: 'REQUIRED'
    });
    return errors; // Don't check other validations if required field is missing
  }

  // Skip validation if value is not provided and not required
  if (value === undefined || value === null) {
    return errors;
  }

  // Type validation
  if (fieldSchema.type) {
    const isValidType = validateType(value, fieldSchema.type);
    if (!isValidType) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be of type ${fieldSchema.type}`,
        code: 'INVALID_TYPE'
      });
    }
  }

  // String validations
  if (fieldSchema.type === 'string' && typeof value === 'string') {
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${fieldSchema.minLength} characters long`,
        code: 'MIN_LENGTH'
      });
    }

    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${fieldSchema.maxLength} characters long`,
        code: 'MAX_LENGTH'
      });
    }

    if (fieldSchema.pattern && !fieldSchema.pattern.test(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} format is invalid`,
        code: 'INVALID_FORMAT'
      });
    }

    if (fieldSchema.enum && !fieldSchema.enum.includes(value)) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be one of: ${fieldSchema.enum.join(', ')}`,
        code: 'INVALID_ENUM'
      });
    }
  }

  // Number validations
  if (fieldSchema.type === 'number' && typeof value === 'number') {
    if (fieldSchema.min !== undefined && value < fieldSchema.min) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be at least ${fieldSchema.min}`,
        code: 'MIN_VALUE'
      });
    }

    if (fieldSchema.max !== undefined && value > fieldSchema.max) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must be no more than ${fieldSchema.max}`,
        code: 'MAX_VALUE'
      });
    }
  }

  // Array validations
  if (fieldSchema.type === 'array' && Array.isArray(value)) {
    if (fieldSchema.minLength && value.length < fieldSchema.minLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must have at least ${fieldSchema.minLength} items`,
        code: 'MIN_LENGTH'
      });
    }

    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push({
        field: fieldName,
        message: `${fieldName} must have no more than ${fieldSchema.maxLength} items`,
        code: 'MAX_LENGTH'
      });
    }
  }

  return errors;
}

// Type validation helper
function validateType(value: any, expectedType: string): boolean {
  switch (expectedType) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'object':
      return typeof value === 'object' && value !== null && !Array.isArray(value);
    case 'array':
      return Array.isArray(value);
    default:
      return true;
  }
}

// Validate page data
export function validatePage(pageData: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate each field
  for (const [fieldName, value] of Object.entries(pageData)) {
    const fieldErrors = validateField(value, fieldName, pageValidationSchema);
    errors.push(...fieldErrors);
  }

  // Additional business logic validations
  if (pageData.sections && Array.isArray(pageData.sections)) {
    for (let i = 0; i < pageData.sections.length; i++) {
      const section = pageData.sections[i];
      const sectionErrors = validateSection(section, i);
      errors.push(...sectionErrors);
    }
  }

  // Validate slug uniqueness (this would need to be checked against database)
  if (pageData.slug) {
    const slugErrors = validateSlug(pageData.slug);
    errors.push(...slugErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate section data
export function validateSection(section: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const [fieldName, value] of Object.entries(section)) {
    const fieldErrors = validateField(value, fieldName, sectionValidationSchema);
    // Add section index to field names for better error reporting
    const indexedErrors = fieldErrors.map(error => ({
      ...error,
      field: `sections[${index}].${error.field}`
    }));
    errors.push(...indexedErrors);
  }

  return errors;
}

// Validate media data
export function validateMedia(mediaData: any): ValidationResult {
  const errors: ValidationError[] = [];

  for (const [fieldName, value] of Object.entries(mediaData)) {
    const fieldErrors = validateField(value, fieldName, mediaValidationSchema);
    errors.push(...fieldErrors);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// Validate slug format and content
export function validateSlug(slug: string): ValidationError[] {
  const errors: ValidationError[] = [];

  if (!/^[a-z0-9-]+$/.test(slug)) {
    errors.push({
      field: 'slug',
      message: 'Slug can only contain lowercase letters, numbers, and hyphens',
      code: 'INVALID_SLUG_FORMAT'
    });
  }

  if (slug.startsWith('-') || slug.endsWith('-')) {
    errors.push({
      field: 'slug',
      message: 'Slug cannot start or end with a hyphen',
      code: 'INVALID_SLUG_FORMAT'
    });
  }

  if (slug.includes('--')) {
    errors.push({
      field: 'slug',
      message: 'Slug cannot contain consecutive hyphens',
      code: 'INVALID_SLUG_FORMAT'
    });
  }

  return errors;
}

// API response helpers
export function createValidationErrorResponse(errors: ValidationError[]): NextResponse {
  return NextResponse.json({
    success: false,
    error: 'Validation failed',
    details: errors,
    message: 'Please check the provided data and try again'
  }, { status: 400 });
}

export function createSuccessResponse(data: any, message?: string): NextResponse {
  return NextResponse.json({
    success: true,
    data,
    message: message || 'Operation completed successfully'
  });
}

export function createErrorResponse(error: string, status: number = 500): NextResponse {
  return NextResponse.json({
    success: false,
    error,
    message: 'An error occurred while processing your request'
  }, { status });
}

// Request validation middleware
export async function validateRequest(
  request: NextRequest,
  schema: any
): Promise<{ data: any; errors: ValidationError[] }> {
  try {
    const data = await request.json();
    const errors: ValidationError[] = [];

    for (const [fieldName, value] of Object.entries(data)) {
      const fieldErrors = validateField(value, fieldName, schema);
      errors.push(...fieldErrors);
    }

    return { data, errors };
  } catch (error) {
    return {
      data: null,
      errors: [{
        field: 'body',
        message: 'Invalid JSON in request body',
        code: 'INVALID_JSON'
      }]
    };
  }
}

// Rate limiting helper (simple in-memory implementation)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);

  if (!record || now > record.resetTime) {
    requestCounts.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

// Sanitize data for database storage
export function sanitizeForDatabase(data: any): any {
  if (typeof data === 'string') {
    // Remove potentially dangerous characters
    return data.replace(/[<>]/g, '');
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForDatabase);
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForDatabase(value);
    }
    return sanitized;
  }

  return data;
}

// Validate file upload
export function validateFileUpload(
  file: File,
  maxSize: number = 10 * 1024 * 1024, // 10MB
  allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (file.size > maxSize) {
    errors.push({
      field: 'file',
      message: `File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`,
      code: 'FILE_TOO_LARGE'
    });
  }

  if (!allowedTypes.includes(file.type)) {
    errors.push({
      field: 'file',
      message: `File type must be one of: ${allowedTypes.join(', ')}`,
      code: 'INVALID_FILE_TYPE'
    });
  }

  return errors;
} 