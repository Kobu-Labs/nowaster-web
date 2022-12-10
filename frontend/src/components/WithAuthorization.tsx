import { FC, ReactNode } from "react";
import Loading from "../pages/Loading";
import useAuth from "../hooks/useAuth";
import { Navigate } from "react-router-dom";

export function WithAuthorization<TProps>(
  WrappedComponent: FC<TProps>
): (props: TProps) => ReactNode {
  const wrapper = (props: TProps) => {
    const { auth, isLoading, isError } = useAuth();

    if (isLoading) {
      return <Loading />;
    }

    if (auth?.status === "error" || isError) {
      return <Navigate to="/login" />;
    }
    return <WrappedComponent {...props} key="1" />;
  };

  return wrapper;
}
