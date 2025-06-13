import { NextRequest, NextResponse } from 'next/server';
import { invalidateAllCache, invalidateCache } from '@/lib/cache-utils';
import { CACHE_TAGS } from '@/lib/cache-config';

/**
 * API handler ქეშის განახლებისთვის
 * 
 * POST /api/revalidate?tag=tagName&secret=yourSecret
 * ან
 * POST /api/revalidate?all=true&secret=yourSecret
 */
export async function POST(request: NextRequest) {
  // უსაფრთხოების საიდუმლო კოდი გარე წვდომისთვის
  const REVALIDATE_SECRET = process.env.REVALIDATE_SECRET || 'your-default-secret';
  
  // URL-დან პარამეტრების მიღება
  const searchParams = request.nextUrl.searchParams;
  const secret = searchParams.get('secret');
  const tag = searchParams.get('tag');
  const all = searchParams.get('all');

  // შევამოწმოთ საიდუმლო კოდი
  if (secret !== REVALIDATE_SECRET) {
    return NextResponse.json(
      { message: 'Invalid secret' },
      { status: 401 }
    );
  }

  try {
    if (all === 'true') {
      // ყველა ქეშის განახლება
      await invalidateAllCache();
      return NextResponse.json({ message: 'All cache invalidated' });
    } else if (tag && Object.values(CACHE_TAGS).includes(tag)) {
      // კონკრეტული ტაგის ქეშის განახლება
      await invalidateCache(tag);
      return NextResponse.json({ message: `Cache for tag '${tag}' invalidated` });
    } else {
      return NextResponse.json(
        { message: 'Invalid tag parameter' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error revalidating:', error);
    return NextResponse.json(
      { message: 'Error revalidating cache', error: String(error) },
      { status: 500 }
    );
  }
} 