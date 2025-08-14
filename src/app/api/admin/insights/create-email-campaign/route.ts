import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productId, title } = body;

    if (!productId || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: productId, title' },
        { status: 400 }
      );
    }

    // TODO: Integrate with Mailchimp API to create actual email campaign
    // For now, return mock success response
    console.log(`Creating email campaign for product ${productId}: ${title}`);

    // Mock Mailchimp API integration
    const mockCampaignResponse = {
      id: `camp_${Date.now()}`,
      title: `Re-engagement: ${title}`,
      subject: `Don't miss out on ${title}!`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      template: {
        name: 'Product Re-engagement',
        subject: `Special offer on ${title}`,
        previewText: `We noticed you were interested in ${title}. Here's a special offer just for you!`
      }
    };

    return NextResponse.json({
      success: true,
      campaign: mockCampaignResponse,
      message: 'Email campaign draft created successfully',
      nextSteps: [
        'Review the campaign content',
        'Add your personal touch',
        'Set up targeting rules',
        'Schedule or send the campaign'
      ]
    });
  } catch (error) {
    console.error('Error creating email campaign:', error);
    return NextResponse.json(
      { error: 'Failed to create email campaign' },
      { status: 500 }
    );
  }
} 