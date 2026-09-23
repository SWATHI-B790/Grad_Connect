/**
 * Helper function to resolve image URLs for both uploaded backend static files (/uploads/...)
 * and external web image URLs (http://... or https://...).
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath || typeof imagePath !== "string" || !imagePath.trim()) {
    return "https://images.unsplash.com/photo-1563986768609-322da13575f3?q=80&w=1200&auto=format&fit=crop";
  }

  const cleanPath = imagePath.trim();

  // External absolute URLs or data URIs
  if (
    cleanPath.startsWith("http://") ||
    cleanPath.startsWith("https://") ||
    cleanPath.startsWith("data:") ||
    cleanPath.startsWith("blob:")
  ) {
    return cleanPath;
  }

  // Prepend backend port 5000 for local static uploads
  const backendOrigin =
    (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) ||
    "http://localhost:5000";

  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${backendOrigin}${normalizedPath}`;
};
