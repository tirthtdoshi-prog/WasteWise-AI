export type WasteCategory = 'Plastic' | 'Paper' | 'Metal' | 'Glass' | 'Organic' | 'Other';

export interface CategoryScore {
  category: Exclude<WasteCategory, 'Other'>;
  score: number;
}

export interface DiyIdea {
  title: string;
  effort: string;
  whatYouMake: string;
  howToMake: string;
}

export interface ClassificationResult {
  category: WasteCategory;
  confidence: number;
  itemDetected: string;
  binType: string;
  disposalRecommendation: string;
  environmentalImpact: string;
  contaminationTip: string;
  materialGrade: string;
  landfillDecompTime: string;
  recoveryTurnaround: string;
  energySavingsNote: string;
  humanActionSteps: string[];
  humanSafetyAndValue: string;
  recycledProducts: string[];
  realWorldUses: string;
  circularProcessNote: string;
  diyIdeas: DiyIdea[];
  recyclable: boolean;
  compostable: boolean;
  categoryScores: CategoryScore[];
  analysisMs?: number;
}

export interface SampleWasteItem {
  id: string;
  title: string;
  category: Exclude<WasteCategory, 'Other'>;
  subtitle: string;
  imageUrl: string;
}
