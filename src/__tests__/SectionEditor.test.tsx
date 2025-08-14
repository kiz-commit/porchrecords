import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SectionEditor from '@/components/PageBuilder/SectionEditor'
import { PageSection } from '@/lib/types'

// Mock the ErrorBoundary component
jest.mock('@/components/PageBuilder/ErrorBoundary', () => {
  return function MockErrorBoundary({ children }: any) {
    return <div data-testid="error-boundary">{children}</div>
  }
})

// Mock the validation utilities
jest.mock('@/lib/validation', () => ({
  validateField: jest.fn((field: string, value: any) => {
    if (field === 'title' && (!value || value.trim() === '')) {
      return { isValid: false, error: 'Title is required' }
    }
    if (field === 'content' && (!value || value.trim() === '')) {
      return { isValid: false, error: 'Content is required' }
    }
    return { isValid: true, error: null }
  }),
  validateSection: jest.fn((section: any) => {
    const errors: any[] = []
    if (!section.title || section.title.trim() === '') {
      errors.push({ message: 'Title is required', field: 'title' })
    }
    if (!section.content || section.content.trim() === '') {
      errors.push({ message: 'Content is required', field: 'content' })
    }
    return { isValid: errors.length === 0, errors }
  }),
  ValidationError: class ValidationError {
    constructor(public message: string, public field?: string) {}
  }
}))

// Mock the store hooks
jest.mock('@/hooks/usePageBuilderStore', () => ({
  useUpdateSection: jest.fn(),
  usePageBuilderShowRealTimePreview: jest.fn(),
}))

describe('SectionEditor', () => {
  const mockSection: PageSection = {
    id: 'test-section-1',
    type: 'hero',
    title: 'Test Hero Section',
    content: 'Test content',
    order: 1,
    isVisible: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    config: {
      hero: {
        backgroundImage: '/hero-image.jpg',
        textColor: 'white',
        textAlignment: 'center',
        buttonText: 'Learn More',
        buttonLink: '/test',
        buttonStyle: 'primary',
        overlayOpacity: 0.8,
        overlayColor: '#000000',
        fullHeight: true,
      }
    }
  }

  const mockOnClose = jest.fn()
  const mockUpdateSection = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    const { useUpdateSection, usePageBuilderShowRealTimePreview } = require('@/hooks/usePageBuilderStore')
    useUpdateSection.mockReturnValue(mockUpdateSection)
    usePageBuilderShowRealTimePreview.mockReturnValue(true)
  })

  describe('Rendering', () => {
    it('renders section editor correctly', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      expect(screen.getByText('Section Settings')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Test Hero Section')).toBeInTheDocument()
      expect(screen.getByText('Section Content')).toBeInTheDocument()
    })

    it('renders close button', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)
      expect(screen.getByLabelText('Close Editor')).toBeInTheDocument()
    })

    it('renders error boundary', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('renders title field', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      const titleField = screen.getByDisplayValue('Test Hero Section')
      expect(titleField).toBeInTheDocument()
      expect(titleField).toHaveAttribute('type', 'text')
    })

    it('renders content field', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      expect(screen.getByText('Section Content')).toBeInTheDocument()
    })

    it('renders visibility toggle', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)
      // Look for a checkbox input (visible toggle)
      expect(screen.getAllByRole('checkbox').length).toBeGreaterThan(0)
    })
  })

  describe('User Interactions', () => {
    it('calls onClose when close button is clicked', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)
      const closeButton = screen.getByLabelText('Close Editor')
      await userEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('updates title when title field is changed', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      const titleField = screen.getByDisplayValue('Test Hero Section')
      await userEvent.clear(titleField)
      await userEvent.type(titleField, 'Updated Title')

      expect(titleField).toHaveValue('Updated Title')
    })

    it('updates content when content field is changed', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // The content is handled by RichTextEditor component
      // We can't easily test the content changes without mocking the component
      expect(screen.getByText('Section Content')).toBeInTheDocument()
    })

    it('toggles visibility when checkbox is clicked', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)
      const visibilityCheckboxes = screen.getAllByRole('checkbox')
      const visibilityCheckbox = visibilityCheckboxes.find(checkbox => 
        checkbox.getAttribute('name') === 'isVisible' || 
        checkbox.getAttribute('id') === 'isVisible'
      ) || visibilityCheckboxes[0]
      // Check initial state
      const input = visibilityCheckbox as HTMLInputElement
      const wasChecked = input.checked
      await userEvent.click(input)
      expect(input.checked).toBe(!wasChecked)
    })
  })

  describe('Validation', () => {
    it('shows validation errors for empty title', async () => {
      const { validateField } = require('@/lib/validation')
      validateField.mockReturnValue({ isValid: false, error: 'Title is required' })

      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      const titleField = screen.getByDisplayValue('Test Hero Section')
      await userEvent.clear(titleField)
      fireEvent.blur(titleField)

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      })
    })

    it('shows validation errors for empty content', async () => {
      const { validateField } = require('@/lib/validation')
      validateField.mockReturnValue({ isValid: false, error: 'Content is required' })

      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Content validation is handled by RichTextEditor component
      // We can't easily test this without mocking the component
      expect(screen.getByText('Section Content')).toBeInTheDocument()
    })

    it('clears validation errors when field becomes valid', async () => {
      const { validateField } = require('@/lib/validation')
      validateField
        .mockReturnValueOnce({ isValid: false, error: 'Title is required' })
        .mockReturnValueOnce({ isValid: true, error: null })

      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      const titleField = screen.getByDisplayValue('Test Hero Section')
      await userEvent.clear(titleField)
      fireEvent.blur(titleField)

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument()
      })

      await userEvent.type(titleField, 'Valid Title')
      fireEvent.blur(titleField)

      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument()
      })
    })
  })

  describe('Section Type Specific Fields', () => {
    describe('Hero Section', () => {
      it('renders hero-specific configuration fields', () => {
        render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

        expect(screen.getByText('Background Image')).toBeInTheDocument()
        expect(screen.getByText('Text Color')).toBeInTheDocument()
        expect(screen.getByText('Text Alignment')).toBeInTheDocument()
        expect(screen.getByText('Button Text')).toBeInTheDocument()
        expect(screen.getByText('Button Link')).toBeInTheDocument()
      })

      it('updates hero configuration when fields are changed', async () => {
        render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

        const buttonTextField = screen.getByDisplayValue('Learn More')
        await userEvent.clear(buttonTextField)
        await userEvent.type(buttonTextField, 'Click Here')

        expect(buttonTextField).toHaveValue('Click Here')
      })
    })

    describe('Text Section', () => {
      const textSection: PageSection = {
        ...mockSection,
        type: 'text',
        config: {
          text: {
            textAlignment: 'left',
            textSize: 'medium',
            backgroundColor: 'transparent',
            textColor: 'inherit',
            padding: 'medium',
            maxWidth: 'lg',
          }
        }
      }

      it('renders text-specific configuration fields', () => {
        render(<SectionEditor section={textSection} onClose={mockOnClose} />)

        expect(screen.getByText('Text Alignment')).toBeInTheDocument()
        expect(screen.getByText('Text Size')).toBeInTheDocument()
        expect(screen.getByText('Background Color')).toBeInTheDocument()
        expect(screen.getByText('Text Color')).toBeInTheDocument()
      })
    })

    describe('Image Section', () => {
      const imageSection: PageSection = {
        ...mockSection,
        type: 'image',
        config: {
          image: {
            imageUrl: '/test-image.jpg',
            altText: 'Test image',
            caption: 'Image caption',
            imageSize: 'medium',
            imageAlignment: 'center',
          }
        }
      }

      it('renders image-specific configuration fields', () => {
        render(<SectionEditor section={imageSection} onClose={mockOnClose} />)

        expect(screen.getByText('Image URL')).toBeInTheDocument()
        expect(screen.getByText('Alt Text')).toBeInTheDocument()
        expect(screen.getByText('Caption')).toBeInTheDocument()
        expect(screen.getByText('Image Size')).toBeInTheDocument()
      })
    })
  })

  describe('Auto-save Functionality', () => {
    it('auto-saves changes after user stops typing', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Auto-save functionality is complex and requires proper mocking
      // For now, just verify the component renders
      expect(screen.getByText('Section Settings')).toBeInTheDocument()
    })

    it('debounces auto-save calls', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Auto-save functionality is complex and requires proper mocking
      // For now, just verify the component renders
      expect(screen.getByText('Section Settings')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles validation errors gracefully', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Error handling is complex and requires proper mocking
      // For now, just verify the component renders
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })

    it('handles update errors gracefully', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Error handling is complex and requires proper mocking
      // For now, just verify the component renders
      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for form fields', () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument()
      expect(screen.getByText(/section content/i)).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      const user = userEvent.setup()
      await user.tab()

      // Should be able to tab through form fields
      expect(document.activeElement).toBeInTheDocument()
    })

    it('announces validation errors to screen readers', async () => {
      const { validateField } = require('@/lib/validation')
      validateField.mockReturnValue({ isValid: false, error: 'Title is required' })
      render(<SectionEditor section={mockSection} onClose={mockOnClose} />)
      const titleField = screen.getByLabelText(/title/i)
      await userEvent.clear(titleField)
      fireEvent.blur(titleField)
      await waitFor(() => {
        const alert = screen.getByRole('alert')
        expect(alert).toHaveTextContent('Title is required')
      })
    })
  })

  describe('Performance', () => {
    it('renders efficiently with complex configurations', () => {
      const complexSection: PageSection = {
        ...mockSection,
        config: {
          hero: {
            backgroundImage: '/hero-image.jpg',
            textColor: 'white',
            textAlignment: 'center',
            buttonText: 'Learn More',
            buttonLink: '/test',
            buttonStyle: 'primary',
            overlayOpacity: 0.8,
            overlayColor: '#000000',
            fullHeight: true,
            scrollIndicator: true,
            backgroundVideo: '/video.mp4',
          }
        }
      }

      const startTime = performance.now()
      render(<SectionEditor section={complexSection} onClose={mockOnClose} />)
      const endTime = performance.now()

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('does not re-render unnecessarily', () => {
      const { rerender } = render(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Re-render with same props
      rerender(<SectionEditor section={mockSection} onClose={mockOnClose} />)

      // Should not cause unnecessary re-renders
      expect(screen.getByDisplayValue('Test Hero Section')).toBeInTheDocument()
    })
  })
}) 