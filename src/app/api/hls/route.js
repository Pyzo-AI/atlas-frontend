import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');
  const token = searchParams.get('token');

  if (!targetUrl) {
    return new NextResponse('URL is required', { status: 400 });
  }

  try {
    const response = await fetch(targetUrl);
    if (!response.ok) {
      return new NextResponse(`Failed to fetch HLS manifest: ${response.status}`, { status: response.status });
    }

    const m3u8Content = await response.text();
    // Get the base URL (everything up to the last slash)
    const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);

    const lines = m3u8Content.split('\n');
    const processedLines = lines.map(line => {
      let trimmedLine = line.trim();
      
      // Empty lines
      if (!trimmedLine) return line;

      // Handle EXT-X-KEY (Encryption keys)
      if (trimmedLine.startsWith('#EXT-X-KEY:')) {
        if (!token) return line;
        
        // Add token to the URI
        return trimmedLine.replace(/URI="([^"]+)"/, (match, uri) => {
          // If the key URL already has a token (unlikely but safe to check)
          if (uri.includes('token=')) return match;
          
          const separator = uri.includes('?') ? '&' : '?';
          return `URI="${uri}${separator}token=${encodeURIComponent(token)}"`;
        });
      }
      
      // Handle `#EXT-X-MEDIA` lines that contain a URI (e.g. audio variants)
      if (trimmedLine.startsWith('#EXT-X-MEDIA:') && trimmedLine.includes('URI=')) {
        return trimmedLine.replace(/URI="([^"]+)"/, (match, uri) => {
          if (uri.startsWith('data:')) return match; // skip data URIs
          
          const isAbsolute = uri.startsWith('http://') || uri.startsWith('https://');
          const absoluteUrl = isAbsolute ? uri : baseUrl + uri;
          
          // Re-proxy if it's another M3U8 playlist
          if (uri.includes('.m3u8')) {
            const proxyUrl = `/api/hls?url=${encodeURIComponent(absoluteUrl)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
            return `URI="${proxyUrl}"`;
          }
          
          // Just absolute URL for anything else
          return `URI="${absoluteUrl}"`;
        });
      }
      
      // Pass-through other tags untouched
      if (trimmedLine.startsWith('#')) {
        return line;
      }
      
      // If it's a URL (variant playlist or segment)
      if (trimmedLine.startsWith('data:')) return line;
      
      // Convert to absolute URL
      const isAbsolute = trimmedLine.startsWith('http://') || trimmedLine.startsWith('https://');
      const absoluteUrl = isAbsolute ? trimmedLine : baseUrl + trimmedLine;
      
      // Re-proxy if it's another M3U8 playlist
      if (trimmedLine.includes('.m3u8')) {
        return `/api/hls?url=${encodeURIComponent(absoluteUrl)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;
      }
      
      // Ensure all media segments (.ts, .m4s, etc) point strictly to original storage
      return absoluteUrl;
    });

    return new NextResponse(processedLines.join('\n'), {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
  } catch (error) {
    console.log('HLS proxy error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
