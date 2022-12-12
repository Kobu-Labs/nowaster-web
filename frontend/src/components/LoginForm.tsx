import { useNavigate } from "react-router-dom";
import { AuthApi } from "../services";
import { UserLoginSubmit } from "../validation/registrationSubmit";
import NavbarButton from "./NavbarButton";
import { FC, useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LoginResponse } from "../services/authApi";
import { ResponseSingle } from "../services/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "../validation/loginSubmit";

const LoginForm: FC = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserLoginSubmit>({
    resolver: zodResolver(loginSchema),
  });

  const navigate = useNavigate();
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(
    null
  );

  const queryClient = useQueryClient();
  const { mutateAsync: login } = useMutation<
    ResponseSingle<LoginResponse>,
    unknown,
    UserLoginSubmit,
    unknown
  >({
    mutationFn: async (loginData) => await AuthApi.login(loginData),
    retry: false,
  });

  const onSubmit = async (data: UserLoginSubmit) => {
    const result = await login(data);

    if (result.status === "error") {
      setBackendErrorMessage(result.message || "");
      return;
    }
    queryClient.setQueryData(["auth"], () => result);
    navigate("/home");
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white shadow p-8 rounded">
        <h2 className="text-2xl font-bold mb-6 text-indigo-500">Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block font-semibold mb-2 text-indigo-500"
            >
              Email:
            </label>
            <input
              type="text"
              id="email"
              {...register("email")}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black dark:text-white"
            />
          </div>
          <div className="mb-4">
            <label
              htmlFor="password"
              className="block font-semibold mb-2 text-indigo-500"
            >
              Password:
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black dark:text-white"
            />
          </div>
          <div className="mt-6">
            <button
              type="submit"
              className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded"
            >
              Login
            </button>
          </div>
        </form>
        <span className="text-red-500">
          {(errors.email && <>{errors.email.message}</>) ||
            (backendErrorMessage && <>{backendErrorMessage}</>)}
        </span>
        <div className="flex mt-6">
          <span className="text-indigo-500">Dont Have an Account?</span>

          <NavbarButton
            label={"Sign up"}
            path={"/register"}
            icon={""}
          ></NavbarButton>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
