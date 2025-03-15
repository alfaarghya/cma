export enum Status {
  Success = 200,
  NoContent = 204,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
  RequestTimeout = 408,
  Conflict = 409,
  InvalidInput = 411,
  InternalServerError = 500,
  BadGateway = 502,
}

export const StatusMessages: Record<Status, string> = {
  [Status.Success]: "Request successful",
  [Status.NoContent]: "No Content",
  [Status.Unauthorized]: "Unauthorized access",
  [Status.Forbidden]: "Access forbidden",
  [Status.NotFound]: "Resource not found",
  [Status.RequestTimeout]: "Request timed out",
  [Status.Conflict]: "Conflict in request",
  [Status.InvalidInput]: "Invalid input",
  [Status.InternalServerError]: "Internal server error",
  [Status.BadGateway]: "Bad gateway",
};