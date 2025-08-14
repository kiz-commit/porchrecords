import { NextRequest, NextResponse } from 'next/server';

interface SubscribeRequest {
  email: string;
  mailchimpApiKey: string;
  mailchimpAudienceId: string;
  mailchimpServerPrefix: string;
  enableDoubleOptIn: boolean;
  tags: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SubscribeRequest = await request.json();
    const { 
      email, 
      mailchimpApiKey, 
      mailchimpAudienceId, 
      mailchimpServerPrefix, 
      enableDoubleOptIn, 
      tags 
    } = body;

    // Validate required fields
    if (!email || !mailchimpApiKey || !mailchimpAudienceId || !mailchimpServerPrefix) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Prepare Mailchimp API request
    const mailchimpUrl = `https://${mailchimpServerPrefix}.api.mailchimp.com/3.0/lists/${mailchimpAudienceId}/members`;
    
    const mailchimpData = {
      email_address: email,
      status: enableDoubleOptIn ? 'pending' : 'subscribed',
      tags: tags.length > 0 ? tags : undefined,
      merge_fields: {
        FNAME: '', // Can be extended to collect first name
        LNAME: ''  // Can be extended to collect last name
      }
    };

    // Make request to Mailchimp API
    const response = await fetch(mailchimpUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mailchimpApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailchimpData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Mailchimp API error:', errorData);
      
      // Handle specific Mailchimp errors
      if (response.status === 400 && errorData.title === 'Member Exists') {
        return NextResponse.json(
          { error: 'This email is already subscribed to our newsletter' },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to subscribe to newsletter' },
        { status: 500 }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to newsletter',
      data: result
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 