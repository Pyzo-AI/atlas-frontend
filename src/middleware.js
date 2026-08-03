import { NextResponse } from "next/server";

const locales = ["en", "de"];
const defaultLocale = "en";

// Get the preferred locale, similar to above or using a library
function getLocale(request) {
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  if (cookieLocale && locales.includes(cookieLocale)) {
    return cookieLocale;
  }
  return defaultLocale;
}

export function middleware(request) {
  const { pathname, searchParams } = request.nextUrl;
  
  // Ignore /admin paths (handled by admin frontend / reverse proxy)
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // 1. Check if there's a ?lang= param (like eval-fe)
  const langParam = searchParams.get("lang") || searchParams.get("language");
  
  if (langParam && locales.includes(langParam)) {
    // If the URL already starts with the correct locale, we don't need a heavy redirect,
    // but typically we strip the query param to make a clean URL
    const pathnameHasRequestedLocale = pathname.startsWith(`/${langParam}/`) || pathname === `/${langParam}`;
    
    // Create new URL stripping the lang parameter
    const newUrl = request.nextUrl.clone();
    newUrl.searchParams.delete("lang");
    newUrl.searchParams.delete("language");
    
    let redirectPath = pathname;
    
    // Check if current pathname has any locale prefix
    const pathnameHasAnyLocale = locales.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );
    
    if (pathnameHasAnyLocale) {
      // Replace the existing locale with the new one
      const pathWithoutLocale = pathname.split('/').slice(2).join('/');
      redirectPath = `/${langParam}/${pathWithoutLocale}`;
    } else {
      // Add the new locale
      redirectPath = `/${langParam}${pathname === '/' ? '' : pathname}`;
    }
    
    newUrl.pathname = redirectPath;
    
    const response = NextResponse.redirect(newUrl);
    // Set cookie to remember the choice
    response.cookies.set("NEXT_LOCALE", langParam, { path: '/', maxAge: 31536000 });
    return response;
  }

  // 2. Check if the pathname is missing a locale
  const pathnameIsMissingLocale = locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`
  );

  // Redirect if there is no locale
  if (pathnameIsMissingLocale) {
    const locale = getLocale(request);

    const newUrl = request.nextUrl.clone();
    newUrl.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    
    return NextResponse.redirect(newUrl);
  }
}

export const config = {
  // Matcher ignoring `/_next/`, `/api/`, `/admin`, and any static files (files with dots)
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|admin|.*\\..*).*)',
  ],
};
