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
import AvatarPicker from "./AvatarPicker";

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
      const dataWithAvatar = {
        ...data,
        avatar: selectedImage,
      };
      const result = await UserApi.register(dataWithAvatar);
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

  const [selectedImage, setSelectedImage] =
    useState<string>("/avatars/av1.svg");
  const handleAvatarSelect = (selectedAvatar: string) => {
    setSelectedImage(selectedAvatar);
  };

  return (
    <>
      <div className="flex items-center  justify-center h-screen">
        <div className="bg-gray-800 shadow p-8 rounded-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Registration</h2>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex items-center  justify-between mb-2">
              <label>Email Address:</label>
              <input
                type="text"
                {...register("email")}
                className="bg-gray-900 rounded-lg px-2 w-8/12"
              />
            </div>
            <span className="text-red-500">
              {errors.email && <>{errors.email.message}</>}
            </span>
            <div className="flex items-center justify-between mb-2">
              <label>Username:</label>
              <input
                type="text"
                {...register("username")}
                className="bg-gray-900 rounded-lg px-2 w-8/12"
              />
            </div>
            <span className="text-red-500">
              {errors.username && <>{errors.username.message}</>}
            </span>
            <div className="flex items-center mb-2 justify-between">
              <label>Password:</label>
              <input
                type="password"
                {...register("password")}
                className="bg-gray-900 rounded-lg px-2 w-8/12"
              />
            </div>
            <span className="text-red-500">
              {errors.password && <>{errors.password.message}</>}
            </span>

            <AvatarPicker onAvatarSelect={handleAvatarSelect} />

            <div className="mt-6 flex justify-center">
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-12 rounded-lg"
                type="submit"
              >
                Register
              </button>
            </div>
            <span className="text-red-500">
              {backendErrorMessage && <>{backendErrorMessage}</>}
            </span>
          </form>
          <div className="flex mt-6 justify-center">
            <span>Already Have an Account?</span>
            <NavbarButton
              label={"Sign in"}
              path={"/login"}
              icon={""}
            ></NavbarButton>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterForm;
