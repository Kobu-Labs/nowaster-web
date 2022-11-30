import NavbarButton from "./NavbarButton";

const Logout = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-xl">
      <h2 className="mb-4 text-5xl">Logout Successful</h2>
      <p className="mb-4">You have been successfully logged out.</p>
      <NavbarButton
        label={"Back to login"}
        path={"/login"}
        icon={""}
      ></NavbarButton>
    </div>
  );
};

export default Logout;
