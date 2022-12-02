import NavbarButton from "./NavbarButton";
import homeIcon from "../assets/home.svg";
import groupsIcon from "../assets/groups.svg";
import statsIcon from "../assets/stats.svg";
import timerIcon from "../assets/timer.svg";
import logoutIcon from "../assets/logout.svg";
import { AuthApi } from "../services";

const Navbar = () => {
  const onSubmit = async () => {
    const response = await AuthApi.logout();
    console.log(response.data.message);
  };

  return (
    <nav className="flex flex-col h-screen justify-between">
      <ul>
        {/* logo */}
        <li className="mt-4 pb-2 border-b-2 border-indigo-500">
          <NavbarButton label="Home" path="/" icon={homeIcon} />
        </li>
        <li className="mt-4 pb-2 border-b-2 border-indigo-500">
          <NavbarButton label="My Groups" path="/groups" icon={groupsIcon} />
        </li>
        <li className="mt-4 pb-2 border-b-2 border-indigo-500">
          <NavbarButton label="My Stats" path="/stats" icon={statsIcon} />
        </li>
        <li className="mt-4 pb-2 border-b-2 border-indigo-500">
          <NavbarButton label="Timer" path="/timer" icon={timerIcon} />
        </li>
      </ul>
      <ul className="mb-16">
        <li
          className="mt-4 pb-2 border-b-2 border-indigo-500"
          onClick={onSubmit}
        >
          <NavbarButton label="Logout" path="/logout" icon={logoutIcon} />
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
