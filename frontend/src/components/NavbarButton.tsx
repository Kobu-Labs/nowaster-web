import { NavLink } from "react-router-dom";
import { useLocation } from "react-router-dom";

type NavbarButtonProps = {
  label: string;
  path: string;
  icon: string;
};

const NavbarButton = (props: NavbarButtonProps) => {
  const location = useLocation();
  return (
    <NavLink to={props.path}>
      <div
        className={`${
          location.pathname === props.path
            ? "text-white"
            : "text-blue-600 hover:text-blue-700"
        } flex items-center gap-4   font-medium `}
      >
        <img src={props.icon}></img> {props.label}
      </div>
    </NavLink>
  );
};

export default NavbarButton;
