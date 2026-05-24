export type AppErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(code: AppErrorCode, httpStatus: number, message: string, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  static notFound(resource = 'Resource'): AppError {
    return new AppError('NOT_FOUND', 404, `${resource} not found`);
  }
  static unauthenticated(message = 'Not authenticated'): AppError {
    return new AppError('UNAUTHENTICATED', 401, message);
  }
  static forbidden(message = 'Forbidden'): AppError {
    return new AppError('FORBIDDEN', 403, message);
  }
  static conflict(message: string): AppError {
    return new AppError('CONFLICT', 409, message);
  }
  static validation(message: string, details?: unknown): AppError {
    return new AppError('VALIDATION_ERROR', 400, message, details);
  }
}
