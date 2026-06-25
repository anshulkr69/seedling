export interface GrantFilters {
  page?: number;
  limit?: number;
  cause?: string;
  funder?: string;
  deadline_before?: string;
  search?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface ApplicationFilters {
  page?: number;
  limit?: number;
  status?: string;
}

export interface ProjectFilters {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
