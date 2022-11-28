import { NavLink } from "react-router-dom";

type NavbarButtonProps = {
  label: string;
  path: string;
  icon: string;
};

const NavbarButton = (props: NavbarButtonProps) => {
  return (
    <NavLink to={props.path}>
      <div className="flex items-center gap-4">
        <img src={props.icon}></img> {props.label}
      </div>
    </NavLink>
  );
};

export default NavbarButton;
