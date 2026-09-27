/** Categories of sample photos; each has its title in the client's translations. */
export const SAMPLE_CATEGORIES = [
	"nature",
	"cities",
	"animals",
	"food",
	"art",
	"space",
] as const;
export type SampleCategory = (typeof SAMPLE_CATEGORIES)[number];

/** Samples a category shows at once. */
export const SAMPLES_PER_PAGE = 30;
/** Featured samples on Home. */
export const FEATURED_SAMPLES = 12;

/** Unsplash asks for these on every link back to it. */
export const UNSPLASH_REFERRAL = "utm_source=piecemates&utm_medium=referral";
/** Unsplash's home page, for "Photo by … on Unsplash". */
export const UNSPLASH_URL = `https://unsplash.com/?${UNSPLASH_REFERRAL}`;
