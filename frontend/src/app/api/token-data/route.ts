import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export async function GET() {
  try {
    const backendUrl = 'http://localhost:3001/analyzer';
    const response = await fetch(backendUrl, {
      next: { 
        tags: ['analyzer'],
        revalidate: 0
      },
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch token data: ${response.status}`);
    }
    const result = await response.json();
    return NextResponse.json(result, {
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0, s-maxage=0, stale-while-revalidate=0, stale-if-error=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'X-Timestamp': Date.now().toString(),
        'X-Cache-Status': 'MISS'
      }
    });
  } catch (error: any) {
    console.error('Proxy error fetching token data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to proxy token data', 
        results: [],
        timestamp: Date.now()
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    );
  }
}