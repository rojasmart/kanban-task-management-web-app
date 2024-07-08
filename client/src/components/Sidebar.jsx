import { useState } from "react";
import { useTheme } from "../../themeContext";
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
          <p className="title text-custom-lightgray pl-4 pb-4 overflow-hidden whitespace-nowrap text-overflow-ellipsis">
            All Boards
          </p>
          <ul className="list">
            <li>
              <button className="hover:bg-custom-blue hover:text-custom-white">
                Platform Launch
              </button>
            </li>
            <li>
              <button className="hover:bg-custom-blue hover:text-custom-white">
                Marketing Plan
              </button>
            </li>
            <li>
              <button className="hover:bg-custom-blue hover:text-custom-white">
                Roadmap
              </button>
            </li>
            <li>
              <button>+ Create New Board</button>
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
