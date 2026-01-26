
export enum AppTab {
  HOME = 'home',
  DISCOVER = 'discover',
  PROFILE = 'profile',
}

export interface ArtworkAnalysis {
  id: string;
  title: string;
  artist: string;
  artistGender?: string;
  style: string;
  period: string;
  origin: string;
  palette: string[];
  composition: string;
  interpretation: string;
  imageUrl: string;
  authorName?: string;
  authorAvatar?: string;
  isSaved?: boolean;
  likes?: number;
  
  // New Expert Modules
  coreAnalysis?: {
    styleAndSchool: string;
    colorUsage: string;
    brushworkTexture: string;
    compositionLayout: string;
    themeAndMood: string;
    artisticValue: string;
  };
  artistInfo?: {
    basics: string;
    marketPosition: string;
    representativeWorks: string;
    styleEvolution: string;
  };
  investmentAnalysis?: {
    rating: 'S' | 'A' | 'B' | 'C' | 'D';
    ratingReason: string;
    marketTrends: string;
    collectionAdvice: string;
    riskAlert: string;
    alternatives: string;
  };
}

export interface GalleryItem {
  id: string;
  imageUrl: string;
  tag: string;
  authorName: string;
  authorAvatar: string;
  likes: string;
  title?: string;
}

export interface FeaturedItem {
  id: string;
  title: string;
  artist: string;
  tag: string;
  imageUrl: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  avatar: string;
}
