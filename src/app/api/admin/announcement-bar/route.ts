import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ANNOUNCEMENT_BAR_FILE = path.join(process.cwd(), 'src', 'data', 'announcementBar.json');

// Helper function to read announcement bar settings from file
function readAnnouncementBarSettings(): any {
  try {
    if (fs.existsSync(ANNOUNCEMENT_BAR_FILE)) {
      const data = fs.readFileSync(ANNOUNCEMENT_BAR_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error reading announcement bar file:', error);
  }
  return {
    isEnabled: false,
    text: "",
    backgroundColor: "#1f2937",
    textColor: "#ffffff",
    speed: 20,
    updatedAt: null
  };
}

// Helper function to write announcement bar settings to file
function writeAnnouncementBarSettings(settings: any): void {
  try {
    fs.writeFileSync(ANNOUNCEMENT_BAR_FILE, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error writing announcement bar file:', error);
  }
}

// GET - Fetch announcement bar settings
export async function GET() {
  try {
    const settings = readAnnouncementBarSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching announcement bar settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch announcement bar settings' },
      { status: 500 }
    );
  }
}

// POST - Update announcement bar settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { isEnabled, text, backgroundColor, textColor, speed } = body;

    const settings = {
      isEnabled: isEnabled || false,
      text: text || "",
      backgroundColor: backgroundColor || "#1f2937",
      textColor: textColor || "#ffffff",
      speed: speed || 20,
      updatedAt: new Date().toISOString()
    };

    writeAnnouncementBarSettings(settings);

    return NextResponse.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error updating announcement bar settings:', error);
    return NextResponse.json(
      { error: 'Failed to update announcement bar settings' },
      { status: 500 }
    );
  }
} 