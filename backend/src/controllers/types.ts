export type ApiResponse<T> =
  | {
      status: "success";
      data: T;
      message: string;
    }
  | {
      status: "failure";
      data: T;
      error: string;
    };
