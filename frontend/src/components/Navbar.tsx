import NavbarButton from "./NavbarButton";
import homeIcon from "../assets/home.svg";
import groupsIcon from "../assets/groups.svg";
import statsIcon from "../assets/stats.svg";
import timerIcon from "../assets/timer.svg";
import logoutIcon from "../assets/logout.svg";
import adminIcon from "../assets/admin.svg";
import logo from "../assets/logo.svg";
import { AuthApi, UserFunctionApi } from "../services";
import { NavLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuth from "../hooks/useAuth";

const Navbar = () => {
    const onSubmit = async () => {
        //TODO: handle this with key invalidation
        await AuthApi.logout();
    };


    const { auth } = useAuth()

    const { data } = useQuery({
        queryKey: ["admin-function"],
        retry: false,
        queryFn: async () => await UserFunctionApi.getByUser({
            userId: auth!.data.id,
        }),
        staleTime: 1000 * 60 * 60, // 1 hour
        refetchOnWindowFocus: false,
    });
    console.log(data)


    return (
        <nav className="flex flex-col h-screen justify-between bg-gray-900 px-6 w-56">
            <ul>
                <li className="mb-6">
                    <NavLink to={"/home"}>
                        <div className="flex items-center gap-4 w-6/12 m-4">
                            <img src={logo}></img> <h2 className="text-white">PB138 Timer</h2>
                        </div>
                    </NavLink>
                </li>
                <li
                    className={`${location.pathname === "/home" ? "" : ""
                        } pb-2 border-b-2 border-blue-600 mt-4 `}
                >
                    <NavbarButton label="Home" path="/home" icon={homeIcon} />
                </li>
                <li className="mt-4 pb-2 border-b-2 border-blue-600">
                    <NavbarButton label="My Groups" path="/groups" icon={groupsIcon} />
                </li>
                <li className="mt-4 pb-2 border-b-2 border-blue-600">
                    <NavbarButton label="My Stats" path="/stats" icon={statsIcon} />
                </li>
                <li className="mt-4 pb-2 border-b-2 border-blue-600">
                    <NavbarButton label="Timer" path="/timer" icon={timerIcon} />
                </li>
                {data?.status === "success" && data.data !== null &&
                    <li className="mt-4 pb-2 border-b-2 border-blue-600">
                        <NavbarButton label="Admin" path="/admin" icon={adminIcon} />
                    </li>}
            </ul>
            <ul className="mb-16">
                <li className="mt-4 pb-2 border-b-2 border-blue-600" onClick={onSubmit}>
                    <NavbarButton label="Logout" path="/logout" icon={logoutIcon} />
                </li>
            </ul>
        </nav>
    );
};

export default Navbar;
