import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import NavbarButton from "./NavbarButton";
import {
  UserRegistrationSubmit,
  registrationSchema,
} from "../validation/registrationSubmit";
import { UserApi } from "../services";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { useState } from "react";

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserRegistrationSubmit>({
    resolver: zodResolver(registrationSchema),
  });

  const navigate = useNavigate();
  const [backendErrorMessage, setBackendErrorMessage] = useState<string | null>(
    null
  );

  const onSubmit = async (data: UserRegistrationSubmit) => {
    try {
      const result = await UserApi.register(data);
      console.log(result);
      navigate("/home");
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
    <>
      <h2 className="text-indigo-500">Registration</h2>
      <div className="flex flex-col items-center justify-center h-screen">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg flex flex-col"
        >
          <div className="flex items-center  justify-between mb-2">
            <label className="text-indigo-500">Email Address:</label>
            <input
              type="text"
              {...register("email")}
              className="border-2 text-white"
            />
          </div>
          <span className="text-red-500">
            {errors.email && <>{errors.email.message}</>}
          </span>
          <div className="flex items-center justify-between mb-2">
            <label className="text-indigo-500">Username:</label>
            <input
              type="text"
              {...register("username")}
              className="border-2 text-white"
            />
          </div>
          <span className="text-red-500">
            {errors.username && <>{errors.username.message}</>}
          </span>
          <div className="flex items-center mb-2 justify-between">
            <label className="text-indigo-500">Password:</label>
            <input
              type="password"
              {...register("password")}
              className="border-2 text-white"
            />
          </div>
          <span className="text-red-500">
            {errors.password && <>{errors.password.message}</>}
          </span>
          <button
            className="bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-2 px-4 rounded ml-32 mr-32"
            type="submit"
          >
            Register
          </button>
          <span className="text-red-500">
            {backendErrorMessage && <>{backendErrorMessage}</>}
          </span>
        </form>
        <div className="flex mt-6">
          <span className="text-indigo-500">Already Have an Account?</span>

          <NavbarButton
            label={"Sign in"}
            path={"/login"}
            icon={""}
          ></NavbarButton>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;
