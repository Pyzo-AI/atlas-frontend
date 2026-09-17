// This frontend's own product id, passed to GET /products/sidebar-tools so it can
// flag which tool is "current." Ported verbatim from pyzo-central-frontend's
// SidebarToolsSwitcher.tsx / config/product.ts — every PYZO product frontend
// (Atlas, Central, Compass, Prism, Relay, Echo) carries this same file, each
// with its own fallback id.
export const CURRENT_PRODUCT_ID = process.env.NEXT_PUBLIC_PRODUCT_ID || "atlas";
