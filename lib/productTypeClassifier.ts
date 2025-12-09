/**
 * Product Type Classification for TTB Categories
 * Maps specific product types to broad TTB classifications
 */

export type TTBCategory = 'Wine' | 'Distilled Spirits' | 'Malt Beverage';

/**
 * Keyword mappings for each TTB category
 * Used as fallback for OCR when Vision API is not available
 */
const categoryKeywords: Record<TTBCategory, string[]> = {
  'Wine': [
    'wine', 'cabernet', 'merlot', 'chardonnay', 'pinot', 'sauvignon',
    'riesling', 'zinfandel', 'syrah', 'shiraz', 'malbec', 'tempranillo',
    'sangiovese', 'nebbiolo', 'grenache', 'viognier', 'moscato', 'gewurztraminer',
    'red wine', 'white wine', 'rosé', 'rose', 'blush', 'table wine',
    'champagne', 'prosecco', 'cava', 'sparkling wine', 'sparkling',
    'port', 'sherry', 'vermouth', 'madeira', 'marsala',
    'sake', 'rice wine', 'mead', 'honey wine',
    'dessert wine', 'ice wine', 'fortified wine'
  ],
  'Distilled Spirits': [
    'whiskey', 'whisky', 'bourbon', 'scotch', 'rye', 'tennessee whiskey',
    'irish whiskey', 'canadian whisky', 'single malt', 'blended whiskey',
    'vodka', 'gin', 'rum', 'tequila', 'mezcal',
    'brandy', 'cognac', 'armagnac', 'grappa', 'pisco',
    'liqueur', 'cordial', 'schnapps', 'absinthe',
    'spirit', 'spirits', 'distilled', 'distilled spirits',
    'moonshine', 'everclear', 'grain alcohol',
    'ouzo', 'arak', 'raki', 'baijiu', 'soju', 'shochu',
    'aquavit', 'genever', 'cachaca'
  ],
  'Malt Beverage': [
    'beer', 'ale', 'lager', 'pilsner', 'pilsen',
    'ipa', 'india pale ale', 'pale ale', 'amber ale', 'brown ale',
    'stout', 'porter', 'wheat beer', 'hefeweizen', 'witbier',
    'sour', 'gose', 'saison', 'farmhouse ale', 'belgian ale',
    'kolsch', 'bock', 'doppelbock', 'dunkel', 'marzen', 'oktoberfest',
    'lambic', 'gueuze', 'kriek', 'barleywine', 'barley wine',
    'dubbel', 'tripel', 'quad', 'quadrupel',
    'malt beverage', 'malt liquor', 'hard seltzer', 'seltzer',
    'cider', 'hard cider', 'perry', 'pear cider',
    'flavored malt beverage', 'fmb', 'alcopop'
  ]
};

/**
 * Classify a product type text into a TTB category
 * Returns the category and a confidence score (0-100)
 */
export function classifyProductType(productText: string): {
  category: TTBCategory | null;
  confidence: number;
  matchedKeyword?: string;
} {
  if (!productText || productText.trim().length === 0) {
    return { category: null, confidence: 0 };
  }

  const normalized = productText.toLowerCase().trim();
  let bestMatch: { category: TTBCategory; confidence: number; keyword: string } | null = null;

  // Check each category for keyword matches
  for (const [category, keywords] of Object.entries(categoryKeywords) as [TTBCategory, string[]][]) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword)) {
        // Calculate confidence based on:
        // 1. Length of keyword (longer = more specific = higher confidence)
        // 2. Position in text (earlier = higher confidence)
        // 3. Whether it's a whole word match

        const keywordLength = keyword.length;
        const position = normalized.indexOf(keyword);
        const isWordBoundary =
          (position === 0 || /\s/.test(normalized[position - 1])) &&
          (position + keywordLength === normalized.length || /\s/.test(normalized[position + keywordLength]));

        // Base confidence: 60-90 based on keyword length
        let confidence = 60 + Math.min(keywordLength * 2, 30);

        // Bonus for word boundary match
        if (isWordBoundary) confidence += 10;

        // Bonus for early position
        if (position < 10) confidence += 5;

        // Cap at 95 (never 100% confident with keyword matching)
        confidence = Math.min(confidence, 95);

        // Keep the best match (highest confidence)
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { category, confidence, keyword };
        }
      }
    }
  }

  if (bestMatch) {
    return {
      category: bestMatch.category,
      confidence: bestMatch.confidence,
      matchedKeyword: bestMatch.keyword
    };
  }

  return { category: null, confidence: 0 };
}

/**
 * Check if two TTB categories match
 */
export function categoriesMatch(category1: string, category2: string): boolean {
  return category1.toLowerCase().trim() === category2.toLowerCase().trim();
}

/**
 * Get all valid TTB categories
 */
export function getValidCategories(): TTBCategory[] {
  return ['Wine', 'Distilled Spirits', 'Malt Beverage'];
}
