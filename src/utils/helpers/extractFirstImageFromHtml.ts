
// Helper function to extract first image from HTML content (client-side)
export const extractFirstImageFromHtml = (htmlContent: string): string | null => {
    if (!htmlContent || typeof window === 'undefined') return null;

    // Create a temporary div to parse HTML
    const div = document.createElement('div');
    div.innerHTML = htmlContent;

    // Find the first img element
    const img = div.querySelector('img');
    if (img && img.src) {
        return img.src;
    }

    return null;
};
