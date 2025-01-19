import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { logout, type User } from "../util/APIWrapper";
import { FaCog, FaSignOutAlt } from "react-icons/fa";

function Header({ user, sticky = false }: { readonly user?: User; readonly sticky?: boolean }) {
    const [dropdownVisible, setDropdownVisible] = useState(false);

    const navigate = useNavigate();

    const toggleDropdown = () => {
        setDropdownVisible(!dropdownVisible);
    };

    return (
        <header
            className={`flex flex-row border-b-2 border-gray-200 bg-background items-center justify-between px-4 ${sticky ? "sticky top-0 z-10" : ""}`}>
            <div className="relative flex flex-row items-end">
                <h1 className="font-extrabold text-5xl bg-gradient-to-r from-primary to-secondary to-80% inline-block text-transparent bg-clip-text pb-2 pl-1">
                    JukeStack
                </h1>
                <h2 className="ml-1 italic text-xs pb-2">NFT Music Library by Luis Hutterli</h2>
            </div>
            {user ? (
                <div className="relative">
                    <button type="button" onClick={toggleDropdown} className="focus:outline-none">
                        {user.email}
                    </button>
                    {dropdownVisible && (
                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg">
                            {/* <Link
                                to="/app/"
                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-150">
                                <FaCog className="mr-2" /> Settings
                            </Link> */}
							<div className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-150">
								<FaCog className="mr-2" /> Settings
							</div>
                            <button
                                type="button"
                                className="flex items-center w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition duration-150"
                                onClick={() => {
                                    logout();
                                    document.cookie = "";
                                    navigate("/app/login");
                                }}>
                                <FaSignOutAlt className="mr-2" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link
                    to="/app/login"
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition duration-300">
                    Login
                </Link>
            )}
        </header>
    );
}

export default Header;
