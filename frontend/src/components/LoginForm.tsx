import NavbarButton from "./NavbarButton";

const LoginForm = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="bg-white shadow p-8 rounded">
        <h2 className="text-2xl font-bold mb-6 text-indigo-500">Login</h2>
        <form>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block font-semibold mb-2 text-indigo-500"
            >
              Username:
            </label>
            <input
              type="text"
              id="username"
              name="username"
              className="w-full border border-gray-300 rounded px-3 py-2"
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
              name="password"
              className="w-full border border-gray-300 rounded px-3 py-2"
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
