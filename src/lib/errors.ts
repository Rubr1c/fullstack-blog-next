export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export interface HttpErrorOptions {
  cause?: unknown;
}

export class HttpError extends Error {
  public readonly statusCode: HttpStatus;
  public readonly cause?: unknown;

  constructor(
    message: string,
    statusCode: HttpStatus,
    options?: HttpErrorOptions
  ) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.cause = options?.cause;

    Object.setPrototypeOf(this, HttpError.prototype);
  }

  public toJSON() {
    return {
      message: this.message,
      statusCode: this.statusCode,
      cause:
        process.env.NODE_ENV !== 'production' && this.cause instanceof Error
          ? { message: this.cause.message, stack: this.cause.stack }
          : undefined,
    };
  }
}
