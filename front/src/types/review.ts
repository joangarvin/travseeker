export interface ReviewUser {
  id: string;
  nombre: string | null;
  apellidos: string | null;
  avatarUrl: string | null;
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  visitMonth: number | null;
  travelParty: string | null;
  crowdRating: number | null;
  valueRating: number | null;
  accessRating: number | null;
  status: 'published' | 'hidden';
  adminResponse: string | null;
  respondedAt: string | null;
  createdAt: string;
  user: ReviewUser;
}

export interface ReviewInput {
  rating: number;
  comment: string;
  visitMonth?: number | null;
  travelParty?: string | null;
  crowdRating?: number | null;
  valueRating?: number | null;
  accessRating?: number | null;
}

export interface ReviewStats {
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export interface ReviewsResponse {
  reviews: Review[];
  stats: ReviewStats;
}
