export interface ApiError {
  message: string;
  statusCode: number;
  errors?: Record<string, string>;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
