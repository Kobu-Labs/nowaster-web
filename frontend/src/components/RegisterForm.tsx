import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import NavbarButton from "./NavbarButton";

const schema = z.object({
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const RegisterForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = () => {
    console.log();
    // Perform registration logic here
  };

  return (
    <>
      <h2 className="text-indigo-500">Registration</h2>
      <div className="flex flex-col items-center justify-center h-screen">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-lg flex flex-col"
        >
          <div className="flex items-center space-x-4 mb-2">
            <label className="text-indigo-500">Email Address:</label>
            <input type="email" {...register("email")} />
          </div>
          <span className="text-red-500">
            {errors.email && <>{errors.email.message}</>}
          </span>
          <div className="flex items-center space-x-4 mb-2">
            <label className="text-indigo-500">Username:</label>
            <input type="text" {...register("username")} />
          </div>
          <span className="text-red-500">
            {errors.username && <>{errors.username.message}</>}
          </span>
          <div className="flex items-center space-x-4 mb-2">
            <label className="text-indigo-500">Password:</label>
            <input type="password" {...register("password")} />
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
