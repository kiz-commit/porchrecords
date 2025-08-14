// Validation utilities for PageBuilder forms

export interface ValidationError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Generic validation functions
export const required = (value: any, fieldName: string): ValidationError | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return {
      field: fieldName,
      message: `${fieldName} is required`,
      type: 'error'
    };
  }
  return null;
};

export const minLength = (value: string, min: number, fieldName: string): ValidationError | null => {
  if (value && value.length < min) {
    return {
      field: fieldName,
      message: `${fieldName} must be at least ${min} characters`,
      type: 'error'
    };
  }
  return null;
};

export const maxLength = (value: string, max: number, fieldName: string): ValidationError | null => {
  if (value && value.length > max) {
    return {
      field: fieldName,
      message: `${fieldName} must be no more than ${max} characters`,
      type: 'error'
    };
  }
  return null;
};

export const url = (value: string, fieldName: string): ValidationError | null => {
  if (value && !isValidUrl(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid URL`,
      type: 'error'
    };
  }
  return null;
};

export const email = (value: string, fieldName: string): ValidationError | null => {
  if (value && !isValidEmail(value)) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid email address`,
      type: 'error'
    };
  }
  return null;
};

export const number = (value: any, fieldName: string): ValidationError | null => {
  if (value && (isNaN(value) || typeof value !== 'number')) {
    return {
      field: fieldName,
      message: `${fieldName} must be a valid number`,
      type: 'error'
    };
  }
  return null;
};

export const range = (value: number, min: number, max: number, fieldName: string): ValidationError | null => {
  if (value && (value < min || value > max)) {
    return {
      field: fieldName,
      message: `${fieldName} must be between ${min} and ${max}`,
      type: 'error'
    };
  }
  return null;
};

// Helper functions
function isValidUrl(value: string): boolean {
  // Check if it's a data URL (base64 image)
  if (value.startsWith('data:image/')) {
    return true;
  }
  
  // Check if it's a relative URL (starts with /)
  if (value.startsWith('/')) {
    return true;
  }
  
  // Check if it's a regular URL (http/https)
  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function isValidEmail(value: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
}

// Page-specific validation functions
export const validatePageContent = (page: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Title validation
  const titleError = required(page.title, 'Title');
  if (titleError) errors.push(titleError);
  
  if (!titleError && page.title) {
    const titleLengthError = maxLength(page.title, 100, 'Title');
    if (titleLengthError) errors.push(titleLengthError);
  }

  // Slug validation
  const slugError = required(page.slug, 'Slug');
  if (slugError) errors.push(slugError);
  
  if (!slugError && page.slug) {
    const slugFormatError = validateSlug(page.slug);
    if (slugFormatError) errors.push(slugFormatError);
  }

  // Description validation
  if (page.description) {
    const descLengthError = maxLength(page.description, 500, 'Description');
    if (descLengthError) errors.push(descLengthError);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateSection = (section: any): ValidationResult => {
  const errors: ValidationError[] = [];

  // Basic section validation
  const titleError = required(section.title, 'Section Title');
  if (titleError) errors.push(titleError);

  // Type-specific validation
  switch (section.type) {
    case 'hero':
      errors.push(...validateHeroSection(section));
      break;
    case 'text':
      errors.push(...validateTextSection(section));
      break;
    case 'image':
      errors.push(...validateImageSection(section));
      break;
    case 'gallery':
      errors.push(...validateGallerySection(section));
      break;
    case 'contact':
      errors.push(...validateContactSection(section));
      break;
    case 'audio':
      errors.push(...validateAudioSection(section));
      break;
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Section-specific validation functions
function validateHeroSection(section: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (section.config?.hero) {
    const config = section.config.hero;
    
    if (config.headline) {
      const headlineError = maxLength(config.headline, 200, 'Headline');
      if (headlineError) errors.push(headlineError);
    }

    if (config.subheadline) {
      const subheadlineError = maxLength(config.subheadline, 300, 'Subheadline');
      if (subheadlineError) errors.push(subheadlineError);
    }

    if (config.backgroundImage) {
      const imageUrlError = url(config.backgroundImage, 'Background Image');
      if (imageUrlError) errors.push(imageUrlError);
    }

    if (config.overlayOpacity !== undefined) {
      const opacityError = range(config.overlayOpacity, 0, 1, 'Overlay Opacity');
      if (opacityError) errors.push(opacityError);
    }
  }

  return errors;
}

function validateTextSection(section: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (section.content) {
    const contentError = maxLength(section.content, 10000, 'Content');
    if (contentError) errors.push(contentError);
  }

  return errors;
}

function validateImageSection(section: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (section.config?.image) {
    const config = section.config.image;
    
    if (config.imageUrl) {
      const imageUrlError = url(config.imageUrl, 'Image URL');
      if (imageUrlError) errors.push(imageUrlError);
    }

    if (config.altText) {
      const altTextError = maxLength(config.altText, 200, 'Alt Text');
      if (altTextError) errors.push(altTextError);
    }

    if (config.caption) {
      const captionError = maxLength(config.caption, 300, 'Caption');
      if (captionError) errors.push(captionError);
    }
  }

  return errors;
}

function validateGallerySection(section: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (section.config?.gallery?.images) {
    const images = section.config.gallery.images;
    
    if (images.length === 0) {
      errors.push({
        field: 'images',
        message: 'At least one image is required for gallery sections',
        type: 'error'
      });
    }

    images.forEach((image: any, index: number) => {
      if (image.url) {
        const imageUrlError = url(image.url, `Image ${index + 1} URL`);
        if (imageUrlError) errors.push(imageUrlError);
      }

      if (image.altText) {
        const altTextError = maxLength(image.altText, 200, `Image ${index + 1} Alt Text`);
        if (altTextError) errors.push(altTextError);
      }

      if (image.caption) {
        const captionError = maxLength(image.caption, 300, `Image ${index + 1} Caption`);
        if (captionError) errors.push(captionError);
      }
    });
  }

  return errors;
}

function validateContactSection(section: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (section.config?.contact) {
    const config = section.config.contact;
    
    if (config.email) {
      const emailError = email(config.email, 'Contact Email');
      if (emailError) errors.push(emailError);
    }

    if (config.phone) {
      const phoneError = maxLength(config.phone, 20, 'Phone Number');
      if (phoneError) errors.push(phoneError);
    }

    if (config.address) {
      const addressError = maxLength(config.address, 500, 'Address');
      if (addressError) errors.push(addressError);
    }
  }

  return errors;
}

function validateAudioSection(section: any): ValidationError[] {
  const errors: ValidationError[] = [];

  if (section.config?.audio) {
    const config = section.config.audio;
    
    if (config.audioUrl) {
      const audioUrlError = url(config.audioUrl, 'Audio URL');
      if (audioUrlError) errors.push(audioUrlError);
    }

    if (config.album) {
      const albumError = maxLength(config.album, 200, 'Album Title');
      if (albumError) errors.push(albumError);
    }

    if (config.artist) {
      const artistError = maxLength(config.artist, 200, 'Artist Name');
      if (artistError) errors.push(artistError);
    }

    if (config.albumArt) {
      const albumArtError = url(config.albumArt, 'Album Art');
      if (albumArtError) errors.push(albumArtError);
    }
  }

  return errors;
}

function validateSlug(slug: string): ValidationError | null {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!slugRegex.test(slug)) {
    return {
      field: 'Slug',
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
      type: 'error'
    };
  }
  return null;
}

// Utility function to get field-specific errors
export const getFieldErrors = (errors: ValidationError[], fieldName: string): ValidationError[] => {
  return errors.filter(error => error.field === fieldName);
};

// Utility function to check if a field has errors
export const hasFieldError = (errors: ValidationError[], fieldName: string): boolean => {
  return errors.some(error => error.field === fieldName);
}; 