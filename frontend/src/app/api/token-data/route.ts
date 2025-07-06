import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Map chain names to their respective JSON file paths
const CHAIN_FILE_MAP: Record<string, string> = {
  flowevm: '/home/trendpup/Trendpup/scraper/flowevm_tokens.json',
  near: '/home/trendpup/Trendpup/scraper/near_tokens.json',
};

export async function GET(request: Request) {
  try {
    // Get chain from query param, default to 'flowevm'
    const url = new URL(request.url);
    const chain = url.searchParams.get('chain') || 'flowevm';
    const FilePath = CHAIN_FILE_MAP[chain] || CHAIN_FILE_MAP['flowevm'];

    let data;
    let jsonData;

    if (fs.existsSync(FilePath)) {
      try {
        data = fs.readFileSync(FilePath, 'utf8');
        jsonData = JSON.parse(data);
        // Support both { tokens: [...] } and root array formats
        let tokens: any[] = [];
        if (Array.isArray(jsonData)) {
          tokens = jsonData;
        } else if (Array.isArray(jsonData.tokens)) {
          tokens = jsonData.tokens;
        } else if (Array.isArray(jsonData.data)) {
          tokens = jsonData.data;
        }
        // Always return an array, even if empty
        return new NextResponse(
          JSON.stringify({ data: tokens }),
          {
            status: 200,
            headers: { 'Cache-Control': 'no-store', 'Content-Type': 'application/json' }
          }
        );
      } catch (error) {
        console.error('Error reading or parsing Token data:', error);
        return NextResponse.json(
          { error: 'Failed to fetch Token data', data: [] },
          { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
      }
    } else {
      console.log('File not found:', FilePath);
      return NextResponse.json(
        { error: 'Token data file not found', data: [] },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Unexpected server error', data: [] },
      { status: 500, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}