import PropTypes from "prop-types";
import { useState } from "react";
import { useTheme } from "../../themeContext";
import IconBoard from "../assets/icon-board.svg";
import ThemeToggle from "./ThemeToggle";
import SidebarToggle from "./SidebarToggle";

import "../index.css";

function Sidebar({ toggleModal, boards, onSelectBoard }) {
  const [isOpen, setIsOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const toggleSidebar = () => setIsOpen(!isOpen);

  return (
    <>
      <div className={`sidebar ${isDarkMode ? "bg-custom-darkgray" : "bg-custom-white"} ${isOpen ? "open" : ""}`}>
        <div className="pl-4">
          <p className="title text-sm text-custom-lightgray pl-4 pb-4 overflow-hidden whitespace-nowrap text-overflow-ellipsis">All Boards</p>
          <ul className="list">
            {boards.map((board) => (
              <li key={board.id}>
                <button
                  onClick={() => onSelectBoard(board)} // Chame a função de callback ao clicar
                  className="hover:bg-custom-blue text-custom-lightgray hover:text-custom-white flex items-center font-bold"
                >
                  <img src={IconBoard} className="mr-2" alt="Board Icon" />
                  {board.name}
                </button>
              </li>
            ))}

            <li>
              <button className="flex items-center text-custom-blue font-bold" onClick={toggleModal}>
                <img src={IconBoard} className="mr-2 " alt="Board Icon" />+ Create New Board
              </button>
            </li>
          </ul>
        </div>

        <SidebarToggle isOpen={isOpen} toggleSidebar={toggleSidebar} />
        <div className={`theme-toggle-container ${isDarkMode ? "bg-custom-gray" : "bg-custom-lightwhite"}`}>
          <ThemeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
        </div>
      </div>

      <div className={`content ${isOpen ? "shifted" : ""}`}>{/* Conteúdo principal vai aqui */}</div>
    </>
  );
}

Sidebar.propTypes = {
  toggleModal: PropTypes.func,
  boards: PropTypes.array,
  onSelectBoard: PropTypes.func.isRequired, // Adicione a prop de callback
};

export default Sidebar;
