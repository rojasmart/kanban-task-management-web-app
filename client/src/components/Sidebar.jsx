import { useState, useEffect } from "react";
import "../index.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  return (
    <>
      <div
        className={`sidebar ${
          isDarkMode ? "bg-custom-darkgray" : "bg-custom-white"
        } ${isOpen ? "open" : ""}`}
      >
        <a href="#" className="text-custom-dark dark:text-custom-light">
          Link 1
        </a>
        <a href="#" className="text-custom-dark dark:text-custom-light">
          Link 2
        </a>
        <a href="#" className="text-custom-dark dark:text-custom-light">
          Link 3
        </a>
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
