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
  createdAt: string;
  user: ReviewUser;
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
