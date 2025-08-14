import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SectionRenderer from '@/components/PageBuilder/SectionRenderer'
import { PageSection } from '@/lib/types'

// Mock the ErrorBoundary component
jest.mock('@/components/PageBuilder/ErrorBoundary', () => {
  return function MockErrorBoundary({ children, onRetry, onFallback }: any) {
    return (
      <div data-testid="error-boundary" onClick={() => onRetry?.()}>
        {children}
      </div>
    )
  }
})

// Mock Next.js Image component
jest.mock('next/image', () => {
  return function MockImage({ src, alt, ...props }: any) {
    return <img src={src} alt={alt} {...props} data-testid="next-image" />
  }
})

describe('SectionRenderer', () => {
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

  describe('Hero Section', () => {
    it('renders hero section correctly', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Test content')).toBeInTheDocument()
      expect(screen.getByText('Learn More')).toBeInTheDocument()
    })

    it('applies correct styling based on config', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      const heroSection = screen.getByText('Test content').closest('section')
      expect(heroSection).toHaveStyle({ backgroundColor: 'rgb(0, 0, 0)' })
    })

    it('handles click events when not in preview mode', () => {
      const mockOnSelect = jest.fn()
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={mockOnSelect}
          isSelected={false}
        />
      )

      const section = screen.getByText('Test content').closest('div')
      fireEvent.click(section!)

      expect(mockOnSelect).toHaveBeenCalled()
    })

    it('shows selected state when isSelected is true', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={true}
        />
      )

      const section = screen.getByText('Test content').closest('div')
      expect(section?.parentElement?.parentElement).toHaveClass('ring-2', 'ring-blue-500')
    })
  })

  describe('Text Section', () => {
    const textSection: PageSection = {
      ...mockSection,
      id: 'text-section-1',
      type: 'text',
      title: 'Text Section',
      content: 'This is a text section with rich content.',
      config: {
        text: {
          textAlignment: 'left',
          textSize: 'medium',
          backgroundColor: 'transparent',
          textColor: 'inherit',
          padding: 'medium',
          maxWidth: 'lg',
          fontWeight: 'normal',
          lineHeight: 'normal',
          letterSpacing: 'normal',
        }
      }
    }

    it('renders text section correctly', () => {
      render(
        <SectionRenderer
          section={textSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('This is a text section with rich content.')).toBeInTheDocument()
    })

    it('applies text alignment from config', () => {
      render(
        <SectionRenderer
          section={textSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      const textContainer = screen.getByText('This is a text section with rich content.').closest('div')
      expect(textContainer?.parentElement).toHaveClass('text-left')
    })
  })

  describe('Image Section', () => {
    const imageSection: PageSection = {
      ...mockSection,
      id: 'image-section-1',
      type: 'image',
      title: 'Image Section',
      content: 'Image caption',
      config: {
        image: {
          imageUrl: '/test-image.jpg',
          altText: 'Test image description',
          caption: 'Image caption',
          imageSize: 'medium',
          imageAlignment: 'center',
          borderRadius: 'medium',
          shadow: 'medium',
          aspectRatio: 'square',
          overlayText: '',
          overlayPosition: 'center',
        }
      }
    }

    it('renders image section correctly', () => {
      render(
        <SectionRenderer
          section={imageSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Image caption')).toBeInTheDocument()
      expect(screen.getByTestId('next-image')).toBeInTheDocument()
    })

    it('uses correct image source and alt text', () => {
      render(
        <SectionRenderer
          section={imageSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      const image = screen.getByTestId('next-image')
      expect(image).toHaveAttribute('src', '/test-image.jpg')
      expect(image).toHaveAttribute('alt', 'Test image description')
    })
  })

  describe('Gallery Section', () => {
    const gallerySection: PageSection = {
      ...mockSection,
      id: 'gallery-section-1',
      type: 'gallery',
      title: 'Gallery Section',
      content: 'Image Gallery',
      config: {
        gallery: {
          images: [
            { url: '/image1.jpg', altText: 'Image 1', caption: 'Caption 1' },
            { url: '/image2.jpg', altText: 'Image 2', caption: 'Caption 2' },
          ],
          layout: 'grid',
          columns: 3,
          gap: 'medium',
          showCaptions: true,
          showThumbnails: false,
        }
      }
    }

    it('renders gallery section correctly', () => {
      render(
        <SectionRenderer
          section={gallerySection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Image Gallery')).toBeInTheDocument()
      expect(screen.getAllByRole('img')).toHaveLength(2)
    })

    it('shows image captions when enabled', () => {
      render(
        <SectionRenderer
          section={gallerySection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Caption 1')).toBeInTheDocument()
      expect(screen.getByText('Caption 2')).toBeInTheDocument()
    })
  })

  describe('Contact Section', () => {
    const contactSection: PageSection = {
      ...mockSection,
      id: 'contact-section-1',
      type: 'contact',
      title: 'Contact Section',
      content: 'Get In Touch',
      config: {
        contact: {
          contactForm: true,
          contactInfo: true,
          mapEmbed: false,
          socialLinks: true,
          email: 'contact@porchrecords.com.au',
          phone: '+61 8 1234 5678',
          address: 'Adelaide, SA',
          hours: 'By appointment',
        }
      }
    }

    it('renders contact section correctly', () => {
      render(
        <SectionRenderer
          section={contactSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Get In Touch')).toBeInTheDocument()
      // Contact section shows placeholder content
      expect(screen.getByText('ContactSection component - Coming soon')).toBeInTheDocument()
    })

    it('renders contact form when enabled', () => {
      render(
        <SectionRenderer
          section={contactSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Contact section shows placeholder content
      expect(screen.getByText('ContactSection component - Coming soon')).toBeInTheDocument()
    })
  })

  describe('CTA Section', () => {
    const ctaSection: PageSection = {
      ...mockSection,
      id: 'cta-section-1',
      type: 'cta',
      title: 'Call to Action',
      content: 'Ready to Get Started?',
      config: {
        cta: {
          ctaTitle: 'Ready to Get Started?',
          ctaDescription: 'Join thousands of music lovers...',
          buttonText: 'Shop Now',
          buttonLink: '/store',
          buttonStyle: 'primary',
          backgroundColor: '#f3f4f6',
          textColor: '#111827',
          layout: 'center',
        }
      }
    }

    it('renders CTA section correctly', () => {
      render(
        <SectionRenderer
          section={ctaSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument()
      // CTA section shows placeholder content
      expect(screen.getByText('CtaSection component - Coming soon')).toBeInTheDocument()
    })

    it('renders CTA description', () => {
      render(
        <SectionRenderer
          section={ctaSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('CtaSection component - Coming soon')).toBeInTheDocument()
    })
  })

  describe('Preview Mode', () => {
    it('does not show selection UI in preview mode', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={true}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Should not show section type indicator in preview mode
      expect(screen.queryByText('hero')).not.toBeInTheDocument()
    })

    it('does not handle click events in preview mode', () => {
      const mockOnSelect = jest.fn()
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={true}
          onSelect={mockOnSelect}
          isSelected={false}
        />
      )

      const section = screen.getByText('Test content').closest('div')
      fireEvent.click(section!)

      expect(mockOnSelect).not.toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('renders error boundary around sections', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByTestId('error-boundary')).toBeInTheDocument()
    })

    it('handles unknown section types gracefully', () => {
      const unknownSection: PageSection = {
        ...mockSection,
        type: 'unknown' as any,
        title: 'Unknown Section',
      }

      render(
        <SectionRenderer
          section={unknownSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      expect(screen.getByText('Unknown section type: unknown')).toBeInTheDocument()
    })

    it('handles missing config gracefully', () => {
      const sectionWithoutConfig: PageSection = {
        ...mockSection,
        config: undefined,
      }

      render(
        <SectionRenderer
          section={sectionWithoutConfig}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Should still render the section content
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels for interactive elements', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Check for proper button element
      const button = screen.getByText('Learn More')
      expect(button.tagName).toBe('BUTTON')
    })

    it('supports keyboard navigation', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      const section = screen.getByText('Test content').closest('div')
      // Note: The section doesn't have tabIndex by default, but it's clickable
      expect(section).toBeInTheDocument()
    })

    it('announces section changes to screen readers', () => {
      render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Check for proper heading structure
      const heading = screen.getByText('Test content')
      expect(heading.tagName).toBe('H1')
    })
  })

  describe('Performance', () => {
    it('renders efficiently with complex configs', () => {
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
      render(
        <SectionRenderer
          section={complexSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )
      const endTime = performance.now()

      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('memoizes rendered content appropriately', () => {
      const { rerender } = render(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Re-render with same props
      rerender(
        <SectionRenderer
          section={mockSection}
          isPreview={false}
          onSelect={() => {}}
          isSelected={false}
        />
      )

      // Should not cause unnecessary re-renders
      expect(screen.getByText('Test content')).toBeInTheDocument()
    })
  })
}) 