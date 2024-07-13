import { useState } from "react";
import { useTheme } from "../../themeContext";
import { Link } from "react-router-dom";
import IconBoard from "../assets/icon-board.svg";
import "../index.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div
        className={`sidebar  ${
          isDarkMode ? "bg-custom-darkgray" : "bg-custom-white"
        } ${isOpen ? "open" : ""}`}
      >
        <div className="pl-4">
          <p className="title text-sm text-custom-lightgray pl-4 pb-4 overflow-hidden whitespace-nowrap text-overflow-ellipsis">
            All Boards
          </p>
          <ul className="list">
            <li>
              <Link
                to="platform-launch"
                className="hover:bg-custom-blue text-custom-lightgray hover:text-custom-white flex items-center font-bold"
              >
                <img src={IconBoard} className="mr-2 " alt="Board Icon" />
                Platform Launch
              </Link>
            </li>
            <li>
              <Link
                to="marketing-plan"
                className="hover:bg-custom-blue text-custom-lightgray hover:text-custom-white flex items-center font-bold "
              >
                <img src={IconBoard} className="mr-2 " alt="Board Icon" />
                Marketing Plan
              </Link>
            </li>
            <li>
              <Link
                to="roadmap"
                className="hover:bg-custom-blue text-custom-lightgray hover:text-custom-white flex items-center font-bold"
              >
                <img src={IconBoard} className="mr-2 " alt="Board Icon" />
                Roadmap
              </Link>
            </li>
            <li>
              <button className="hover:bg-custom-blue text-custom-lightgray hover:text-custom-white flex items-center font-bold">
                <img src={IconBoard} className="mr-2 " alt="Board Icon" />
                Roadmap
              </button>
            </li>
            <li>
              <button className="flex items-center text-custom-blue font-bold">
                <img src={IconBoard} className="mr-2 " alt="Board Icon" />+
                Create New Board
              </button>
            </li>
          </ul>
        </div>

        {/* Buttons moved inside the sidebar */}
        <div>
          <button
            className={`bg-custom-blue mt-4 text-custom-white rounded-full p-3 pl-6 pr-6 theme-btn`}
            onClick={toggleDarkMode}
          >
            Toggle Dark Mode
          </button>
          <button
            className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6 toggle-btn"
            onClick={toggleSidebar}
          >
            {isOpen ? "Close" : "Open"} Sidebar
          </button>
        </div>
      </div>
    </>
  );
}

export default Sidebar;
