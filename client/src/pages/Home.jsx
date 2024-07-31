import { useState } from "react";
import logoDark from "../assets/logo-dark.svg";
import logoLight from "../assets/logo-light.svg";
import Sidebar from "../components/Sidebar";
import ThreeDotMenu from "../components/ThreeDotMenu";
import { useTheme } from "../../themeContext";
import { Outlet } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";

const CREATE_BOARD_MUTATION = gql`
  mutation createBoard($name: String!) {
    createBoard(name: $name) {
      id
      name
    }
  }
`;

export default function Home() {
  const { isDarkMode } = useTheme();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardName, setBoardName] = useState("");

  const [createBoard] = useMutation(CREATE_BOARD_MUTATION);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleCreateBoard = async () => {
    console.log("Board Name before mutation:", boardName); // Add this line
    if (!boardName) {
      console.error("Board name is required");
      return;
    }
    try {
      const response = await createBoard({
        variables: { name: boardName },
      });
      console.log("Board created:", response.data.createBoard);
      setIsModalOpen(false);
      setBoardName("");
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  return (
    <>
      <header
        className={`${
          isDarkMode ? "bg-custom-darkgray" : "bg-custom-white"
        } text-white p-4 pl-8 border-1 border-b-custom-red`}
      >
        <div className="mx-auto flex gap-5 items-center ">
          <div className="logo min-w-[235px]">
            <img
              src={isDarkMode ? logoLight : logoDark}
              alt="Logo"
              className="h-8"
            />
          </div>

          <div className="menu-wrapper flex items-center gap-5 justify-between w-[100%]">
            <p
              className={`font-bold text-2xl ${
                isDarkMode ? "text-custom-lightgray" : "text-custom-dark"
              }`}
            >
              Platform Launch
            </p>
            <div className="nav-links flex items-center gap-4">
              <button className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6">
                Add new task
              </button>
              <ThreeDotMenu />
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center">
          <Sidebar toggleModal={toggleModal} />
          {isModalOpen && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={toggleModal}>
                  &times;
                </span>
                <h2>Create New Board</h2>
                <input
                  type="text"
                  placeholder="Board Name"
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                />
                <button onClick={handleCreateBoard}>Create</button>
              </div>
            </div>
          )}
          <Outlet />
        </div>
      </div>
    </>
  );
}
