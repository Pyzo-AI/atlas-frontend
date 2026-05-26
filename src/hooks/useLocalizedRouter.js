import { useRouter, useParams, usePathname } from "next/navigation";

export const useLocalizedRouter = () => {
  const router = useRouter();
  const params = useParams();
  const pathname = usePathname();
  
  // Extract locale from params, or fallback to parsing it from the pathname, or default to 'en'
  const locale = params?.locale || (pathname?.split('/')[1] || "en");

  // Helper to safely prepend locale to paths
  const localizePath = (path) => {
    if (!path) return path;
    if (path.startsWith(`/${locale}/`) || path === `/${locale}`) return path;
    if (path.startsWith("http") || path.startsWith("mailto:")) return path;
    
    // Check if it has a different known locale
    const hasOtherLocale = ["en", "de"].some(
      (loc) => path.startsWith(`/${loc}/`) || path === `/${loc}`
    );
    
    if (hasOtherLocale) return path;

    // Handle root vs non-root
    return path === "/" ? `/${locale}` : `/${locale}${path.startsWith('/') ? path : `/${path}`}`;
  };

  return {
    ...router,
    push: (href, options) => {
      return router.push(localizePath(href), options);
    },
    replace: (href, options) => {
      return router.replace(localizePath(href), options);
    },
    // Expose the helper for Link components or other uses
    localizePath,
  };
};
