import type { SampleWasteItem, WasteCategory } from '../types/waste';

export const SAMPLE_WASTE_ITEMS: SampleWasteItem[] = [
  {
    id: 'sample-plastic',
    title: 'Clear PET Water Bottle',
    category: 'Plastic',
    subtitle: 'PET #1 container',
    imageUrl: '/src/assets/images/sample_plastic_bottle_1794900310777.jpg',
  },
  {
    id: 'sample-paper',
    title: 'Cardboard & Office Paper',
    category: 'Paper',
    subtitle: 'Cellulose fiber',
    imageUrl: '/src/assets/images/sample_paper_cardboard_1794900310479.jpg',
  },
  {
    id: 'sample-metal',
    title: 'Aluminum & Tin Cans',
    category: 'Metal',
    subtitle: 'Alloy packaging',
    imageUrl: '/src/assets/images/sample_metal_can_1794900310764.jpg',
  },
  {
    id: 'sample-glass',
    title: 'Clear & Emerald Glass',
    category: 'Glass',
    subtitle: 'Silicate jar & bottle',
    imageUrl: '/src/assets/images/sample_glass_jar_1794900310964.jpg',
  },
  {
    id: 'sample-organic',
    title: 'Fruit Peels & Coffee Grounds',
    category: 'Organic',
    subtitle: 'Compostable organics',
    imageUrl: '/src/assets/images/sample_organic_waste_1794900312053.jpg',
  },
];

export interface CategoryVisualMeta {
  category: WasteCategory;
  accentText: string;
  barColor: string;
  recycledImageUrl: string | null;
  recycledImageAlt: string;
  recycledImageCaption: string;
}

export const CATEGORY_VISUAL_META: Record<WasteCategory, CategoryVisualMeta> = {
  Plastic: {
    category: 'Plastic',
    accentText: 'text-blue-700',
    barColor: 'bg-blue-600',
    recycledImageUrl: '/src/assets/images/recycled_plastic_products_1794968564225.jpg',
    recycledImageAlt:
      'Recycled PET fleece jacket, woven rPET fabric rolls, and recycled plastic pellets',
    recycledImageCaption:
      'Recycled PET flakes and pellets transformed into fleece apparel, woven textiles, and new food-grade containers.',
  },
  Paper: {
    category: 'Paper',
    accentText: 'text-amber-700',
    barColor: 'bg-amber-600',
    recycledImageUrl: '/src/assets/images/recycled_paper_products_1794968564296.jpg',
    recycledImageAlt:
      'Molded pulp egg cartons, recycled kraft notebooks, and corrugated cardboard sleeves',
    recycledImageCaption:
      'Recovered cellulose pulp pressed into molded egg trays, recycled notebooks, and protective shipping sleeves.',
  },
  Metal: {
    category: 'Metal',
    accentText: 'text-slate-700',
    barColor: 'bg-slate-700',
    recycledImageUrl: '/src/assets/images/recycled_metal_products_1794968564638.jpg',
    recycledImageAlt:
      'Recycled aluminum beverage cans, machined bicycle crank parts, and coiled aluminum sheet',
    recycledImageCaption:
      'Remelted scrap aluminum rolled into sheet coil and forged into new beverage cans and precision hardware.',
  },
  Glass: {
    category: 'Glass',
    accentText: 'text-teal-700',
    barColor: 'bg-teal-600',
    recycledImageUrl: '/src/assets/images/recycled_glass_products_1794968565287.jpg',
    recycledImageAlt:
      'Polished crushed-glass terrazzo tile, recycled glass apothecary jars, and clean glass cullet',
    recycledImageCaption:
      'Crushed glass cullet remelted into pure new jars or cast into architectural terrazzo surfaces.',
  },
  Organic: {
    category: 'Organic',
    accentText: 'text-emerald-700',
    barColor: 'bg-emerald-600',
    recycledImageUrl: '/src/assets/images/recycled_organic_products_1794968564858.jpg',
    recycledImageAlt:
      'Rich dark sifted organic garden compost beside thriving potted culinary herbs',
    recycledImageCaption:
      'Decomposed food scraps stabilized into nutrient-rich humus that nourishes gardens and urban crops.',
  },
  Other: {
    category: 'Other',
    accentText: 'text-slate-700',
    barColor: 'bg-slate-500',
    recycledImageUrl: null,
    recycledImageAlt: 'Mixed or specialized waste recovery stream',
    recycledImageCaption:
      'Specialized materials require local municipal drop-off or component separation.',
  },
};

export function getCategoryStyle(category: WasteCategory): CategoryVisualMeta {
  return CATEGORY_VISUAL_META[category] ?? CATEGORY_VISUAL_META.Other;
}
