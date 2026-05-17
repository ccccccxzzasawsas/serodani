import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { 
  DYNAMIC_DATA_REVALIDATE_TIME 
} from './lib/cache-config';

const PUBLIC_PAGE_CACHE_CONTROL = 'public, max-age=0, s-maxage=300, stale-while-revalidate=60';

/**
 * მიდლვეარი, რომელიც ამატებს ქეშირების ჰედერებს სხვადასხვა გვერდებისთვის
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const url = request.nextUrl.pathname;

  // ვამოწმებთ თუ რა გვერდზე ვართ და შესაბამისად ვამატებთ ქეშირების ჰედერებს
  if (url === '/' || url.startsWith('/rooms') || url.startsWith('/gallery') || 
      url.startsWith('/fine-dining') || url.startsWith('/wines')) {
    
    // სტატიკური გვერდებისთვის უფრო ხანგრძლივი ქეშირება
    response.headers.set('Cache-Control', PUBLIC_PAGE_CACHE_CONTROL);
  } else if (url.startsWith('/api/') && !url.includes('/revalidate')) {
    // API ენდპოინტებისთვის უფრო მოკლე ქეშირება, გარდა revalidate ენდპოინტისა
    response.headers.set('Cache-Control', `public, max-age=${DYNAMIC_DATA_REVALIDATE_TIME}, s-maxage=${DYNAMIC_DATA_REVALIDATE_TIME}, stale-while-revalidate`);
  }

  return response;
}

/**
 * კონფიგურაცია, რომელიც განსაზღვრავს რომელ მისამართებზე გაეშვება მიდლვეარი
 */
export const config = {
  matcher: [
    /*
     * გამოვრიცხოთ ყველა მისამართი, რომელიც არ უნდა დაკეშირდეს:
     * - api/revalidate (ქეშის განახლების ენდპოინტი)
     * - admin პანელის მისამართები
     * - სტატიკური ფაილები (_next/static, favicon.ico და ა.შ.)
     */
    '/((?!api/revalidate|admin|_next/static|_next/image|favicon.ico).*)',
  ],
};
