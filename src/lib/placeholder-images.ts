import data from './placeholder-images.json';

export type ImagePlaceholder = {
  id: string;
  description: string;
  imageUrl: string;
  imageHint: string;
};

export const PlaceHolderImages: ImagePlaceholder[] = data.placeholderImages;

/**
 * Returns a placeholder image based on the category string.
 * Falls back to a default product image if category is not found.
 */
export function getPlaceholderByCategory(category?: string): ImagePlaceholder {
  const normalizedCategory = category?.toLowerCase() || 'default';
  const found = PlaceHolderImages.find(img => img.id === normalizedCategory);
  if (found) return found;
  return PlaceHolderImages.find(img => img.id === 'default-product') || PlaceHolderImages[0];
}

/**
 * Returns a placeholder image by its explicit ID.
 */
export function getPlaceholderById(id: string): ImagePlaceholder {
  const found = PlaceHolderImages.find(img => img.id === id);
  return found || PlaceHolderImages[0];
}
