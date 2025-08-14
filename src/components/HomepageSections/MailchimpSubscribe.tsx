'use client';

import React, { useState } from 'react';

interface MailchimpSubscribeProps {
  title?: string;
  subtitle?: string;
  placeholder?: string;
  buttonText?: string;
  successMessage?: string;
  errorMessage?: string;
  mailchimpApiKey?: string;
  mailchimpAudienceId?: string;
  mailchimpServerPrefix?: string;
  enableDoubleOptIn?: boolean;
  tags?: string[];
}

export default function MailchimpSubscribe({
  title = "Stay in the Loop",
  subtitle = "Get updates on new releases, shows, and exclusive offers",
  placeholder = "Enter your email address",
  buttonText = "Subscribe",
  successMessage = "Thanks for subscribing!",
  errorMessage = "Something went wrong. Please try again.",
  mailchimpApiKey,
  mailchimpAudienceId,
  mailchimpServerPrefix,
  enableDoubleOptIn = true,
  tags = []
}: MailchimpSubscribeProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !email.includes('@')) {
      setStatus('error');
      return;
    }

    setIsLoading(true);
    setStatus('idle');

    try {
      // Check if Mailchimp configuration is available
      if (!mailchimpApiKey || !mailchimpAudienceId || !mailchimpServerPrefix) {
        console.warn('Mailchimp configuration incomplete, using fallback');
        // Fallback to simulation for development
        await new Promise(resolve => setTimeout(resolve, 1000));
        setStatus('success');
        setEmail('');
        return;
      }

      // Call our API endpoint to handle Mailchimp integration
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          mailchimpApiKey,
          mailchimpAudienceId,
          mailchimpServerPrefix,
          enableDoubleOptIn,
          tags
        }),
      });

      if (response.ok) {
        setStatus('success');
        setEmail('');
      } else {
        const errorData = await response.json();
        console.error('Newsletter subscription error:', errorData);
        setStatus('error');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16 bg-gradient-to-br from-mustard/10 to-clay/10">
      <div className="max-w-4xl mx-auto px-6 text-center">
        {/* Title */}
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold font-mono uppercase tracking-wider text-gray-900 mb-6">
          {title}
        </h2>
        
        {/* Subtitle */}
        <p className="text-sm md:text-base font-mono uppercase tracking-wide opacity-70 mb-8 max-w-2xl mx-auto text-gray-600">
          {subtitle}
        </p>

        {/* Subscribe Form */}
        <form onSubmit={handleSubmit} className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-mustard focus:border-transparent"
              required
            />
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-mustard text-white font-medium rounded-lg hover:bg-mustard/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Subscribing...
                </div>
              ) : (
                buttonText
              )}
            </button>
          </div>
        </form>

        {/* Status Messages */}
        {status === 'success' && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 font-medium">{successMessage}</p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 font-medium">{errorMessage}</p>
          </div>
        )}

        {/* Privacy Note */}
        <p className="text-sm text-gray-500 mt-6">
          We respect your privacy. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
} 