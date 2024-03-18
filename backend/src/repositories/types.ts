import type { Result } from "@badrap/result";

export type AsyncResult<T> = Promise<Result<T>>;

export class UserVisibleError extends Error {
  constructor(message: string) {
    super(message); // (1)
    this.name = "ValidationError"; // (2)
  }
}
