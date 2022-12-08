import { useNavigate } from "react-router-dom";
import { AuthApi } from "../services";
import {
  UserLoginSubmit,
} from "../validation/registrationSubmit";
import NavbarButton from "./NavbarButton";
import { FC, useState } from "react";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";

const LoginForm: FC = () => {
  const {
    register,
    handleSubmit,
  } = useForm<UserLoginSubmit>();

  const navigate = useNavigate();
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(
    null
  );

  const onSubmit = async (data: UserLoginSubmit) => {
    try {
      const result = await AuthApi.login(data);
      console.log(result.data.message);
      navigate("/auth/home");
    } catch (err) {
      if (err instanceof AxiosError) {
        console.log(err.response?.data.message);
        setBackendErrorMessage(err.response?.data.message);
      } else {
        console.log("Unexpected error", err);
        setBackendErrorMessage("Unexpected error");
      }
    }
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
              type="email"
              id="email"
              {...register("email")}
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
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
              className="w-full border border-gray-300 rounded px-3 py-2 text-black"
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
          {backendErrorMessage && <>{backendErrorMessage}</>}
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
