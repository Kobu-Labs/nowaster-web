type Data<T> = {
  isOk: boolean;
  isErr: boolean;
  value: T;
};

export type ResponseSingle<T> = {
  data: Data<T>;
  status: string;
};
