import { useState } from "react";
import logoDark from "../assets/logo-dark.svg";
import logoLight from "../assets/logo-light.svg";
import Sidebar from "../components/Sidebar";
import ThreeDotMenu from "../components/ThreeDotMenu";
import { useTheme } from "../../themeContext";
import { gql, useQuery, useMutation } from "@apollo/client";
import BoardPage from "./BoardPage";

const CREATE_BOARD_MUTATION = gql`
  mutation createBoard(
    $name: String!
    $description: String!
    $columns: [ColumnInput!]!
  ) {
    createBoard(name: $name, description: $description, columns: $columns) {
      id
      name
      description
      columns {
        id
        name
        tasks {
          id
          title
          description
        }
      }
    }
  }
`;

const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      name
      description
      columns {
        id
        name
        tasks {
          id
          title
          description
        }
      }
    }
  }
`;

export default function Home() {
  const { isDarkMode } = useTheme();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false); // New state for task modal
  const [boardName, setBoardName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedBoard, setSelectedBoard] = useState(null); // Estado para o board selecionado
  const [newTaskTitle, setNewTaskTitle] = useState(""); // Estado para o título da nova tarefa
  const [newTaskDescription, setNewTaskDescription] = useState(""); // Estado para a descrição da nova tarefa
  const [createBoard] = useMutation(CREATE_BOARD_MUTATION);
  const { loading, error, data, refetch } = useQuery(GET_BOARDS); // Adicione refetch aqui
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleTaskModal = () => setIsTaskModalOpen(!isTaskModalOpen); // New function to toggle task modal

  const handleCreateBoard = async () => {
    if (!boardName) {
      console.error("Board name is required");
      return;
    }
    try {
      const initialColumns = [
        {
          name: "To Do",
          tasks: [
            {
              title: "Initial Task",
              description: "This is an initial task in the To Do column.",
            },
          ],
        },
      ];

      const response = await createBoard({
        variables: {
          name: boardName,
          description: description,
          columns: initialColumns,
        },
      });
      console.log("Board created:", response.data.createBoard);
      setIsModalOpen(false);
      setBoardName("");
      setDescription("");
      refetch(); // Chame refetch após a criação do board
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const handleAddTask = () => {
    if (!newTaskTitle || !newTaskDescription || !selectedBoard) {
      console.error("Task title, description, and selected board are required");
      return;
    }

    const updatedBoard = {
      ...selectedBoard,
      columns: selectedBoard.columns.map((column) => {
        if (column.name === "To Do") {
          return {
            ...column,
            tasks: [
              ...column.tasks,
              {
                id: Date.now().toString(),
                title: newTaskTitle,
                description: newTaskDescription,
              },
            ],
          };
        }
        return column;
      }),
    };

    setSelectedBoard(updatedBoard);
    setNewTaskTitle("");
    setNewTaskDescription("");
    setIsTaskModalOpen(false); // Close the task modal after adding the task
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  const boards = data.boards;

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
              <button
                className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6"
                onClick={toggleTaskModal} // Open task modal
              >
                Add new task
              </button>
              <ThreeDotMenu />
            </div>
          </div>
        </div>
      </header>
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center">
          <Sidebar
            toggleModal={toggleModal}
            boards={boards}
            onSelectBoard={setSelectedBoard}
          />
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
          {isTaskModalOpen && (
            <div className="modal">
              <div className="modal-content">
                <span className="close" onClick={toggleTaskModal}>
                  &times;
                </span>
                <h2>Add New Task</h2>
                <input
                  type="text"
                  placeholder="Task Title"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                />
                <textarea
                  placeholder="Task Description"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                />
                <button onClick={handleAddTask}>Add Task</button>
              </div>
            </div>
          )}
          {selectedBoard && <BoardPage board={selectedBoard} />}
        </div>
      </div>
    </>
  );
}
