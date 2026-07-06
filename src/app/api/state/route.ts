import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://harita.iletisim.gov.tr/api/state', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!response.ok) {
      throw new Error(`State API returned status: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error fetching state from government API:', error);
    // Return mock fallback values if the external API is unreachable or fails
    // so the application continues to run in demo mode.
    return NextResponse.json({
      rev: Date.now(),
      zrev: Date.now(),
      fallback: true
    });
  }
}
