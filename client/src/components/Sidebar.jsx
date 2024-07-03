import { useState } from "react";
import "../index.css";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className={`sidebar bg-custom-white ${isOpen ? "open" : ""}`}>
        <a href="#">Link 1</a>
        <a href="#">Link 2</a>
        <a href="#">Link 3</a>
      </div>
      <button
        className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6 toggle-btn"
        onClick={toggleSidebar}
      >
        {isOpen ? "Close" : "Open"} Sidebar
      </button>
    </>
  );
}

export default Sidebar;
