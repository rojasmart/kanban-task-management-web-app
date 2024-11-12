import { useState, useEffect } from "react";
import logoDark from "../assets/logo-dark.svg";
import logoLight from "../assets/logo-light.svg";
import Sidebar from "../components/Sidebar";
import ThreeDotMenu from "../components/ThreeDotMenu";
import { useTheme } from "../../themeContext";
import { gql, useQuery, useMutation } from "@apollo/client";
import BoardPage from "./BoardPage";

const CREATE_BOARD_MUTATION = gql`
  mutation createBoard($name: String!, $columns: [ColumnInput!]!) {
    createBoard(name: $name, columns: $columns) {
      id
      name
      columns {
        name
        tasks {
          title
        }
      }
    }
  }
`;

const CREATE_COLUMN_MUTATION = gql`
  mutation createColumn($boardId: ID!, $name: String!) {
    createColumn(boardId: $boardId, name: $name) {
      id
      name
      description
      columns {
        name
        tasks {
          title
          description
        }
      }
    }
  }
`;

const ADD_TASK_TO_COLUMN_MUTATION = gql`
  mutation addTaskToColumn($boardId: ID!, $columnName: String!, $task: TaskInput!) {
    addTaskToColumn(boardId: $boardId, columnName: $columnName, task: $task) {
      id
      name
      columns {
        name
        tasks {
          id
          title
          description
          subtasks {
            title
          }
        }
      }
    }
  }
`;

const CREATE_SUBTASK_MUTATION = gql`
  mutation createSubtask($boardId: ID!, $columnName: String!, $taskId: ID!, $subtask: SubtaskInput!) {
    createSubtask(boardId: $boardId, columnName: $columnName, taskId: $taskId, subtask: $subtask) {
      title
    }
  }
`;

const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      name
      columns {
        name
        tasks {
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
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [selectedBoard, setSelectedBoard] = useState(null);
  const [newColumnNames, setNewColumnNames] = useState(["To Do", "Doing"]); // Default columns
  const [boardState, setBoardState] = useState(selectedBoard);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [subtasks, setSubtasks] = useState([{ title: "" }]);
  const [createBoard] = useMutation(CREATE_BOARD_MUTATION);
  const [createColumn] = useMutation(CREATE_COLUMN_MUTATION);
  const [createSubtask] = useMutation(CREATE_SUBTASK_MUTATION);
  const [addTaskToColumn] = useMutation(ADD_TASK_TO_COLUMN_MUTATION);
  const { loading, error, data, refetch } = useQuery(GET_BOARDS);
  const toggleModal = () => setIsModalOpen(!isModalOpen);
  const toggleTaskModal = () => setIsTaskModalOpen(!isTaskModalOpen);

  useEffect(() => {
    setBoardState(selectedBoard);
  }, [selectedBoard]);

  const handleCreateBoard = async () => {
    if (!boardName) {
      console.error("Board name is required");
      return;
    }
    try {
      const initialColumns = newColumnNames.map((name) => ({
        name,
        tasks: [],
      }));

      const response = await createBoard({
        variables: {
          name: boardName,
          columns: initialColumns,
        },
      });
      console.log("Board created:", response.data.createBoard);
      setIsModalOpen(false);
      setBoardName("");
      setNewColumnNames(["To Do", "Doing"]); // Reset to default columns

      refetch();
    } catch (error) {
      console.error("Error creating board:", error);
    }
  };

  const handleAddColumnName = () => {
    setNewColumnNames([...newColumnNames, ""]);
  };

  const handleColumnNameChange = (index, value) => {
    const updatedColumnNames = [...newColumnNames];
    updatedColumnNames[index] = value;
    setNewColumnNames(updatedColumnNames);
  };

  const handleRemoveColumnName = (index) => {
    const updatedColumnNames = newColumnNames.filter((_, i) => i !== index);
    setNewColumnNames(updatedColumnNames);
  };

  const handleCreateColumn = async () => {
    if (!newColumnName) {
      console.error("Column name is required");
      return;
    }
    try {
      const { data } = await createColumn({
        variables: {
          boardId: selectedBoard.id,
          name: newColumnName,
        },
      });
      console.log("Server response:", data); // Log the server response
      const newColumn = data.createColumn.columns.at(-1);

      setBoardState((prevBoard) => ({
        ...prevBoard,
        columns: [...prevBoard.columns, newColumn],
      }));
      setNewColumnName("");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error creating column:", error);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle || !newTaskDescription || !selectedBoard) {
      console.error("Task title, description, and selected board are required");
      return;
    }
    try {
      const response = await addTaskToColumn({
        variables: {
          boardId: selectedBoard.id,
          columnName: "To Do",
          task: {
            title: newTaskTitle,
            description: newTaskDescription,
            subtasks: subtasks.filter((subtask) => subtask.title), // Only include non-empty subtasks
          },
        },
      });
      console.log("Task added:", response.data.addTaskToColumn);
      const newTaskId = response.data.addTaskToColumn.columns
        .find((col) => col.name === "To Do")
        .tasks.find((task) => task.title === newTaskTitle).id;
      for (const subtask of subtasks.filter((subtask) => subtask.title)) {
        await createSubtask({
          variables: {
            boardId: selectedBoard.id,
            columnName: "To Do",
            taskId: newTaskId,
            subtask: { title: subtask.title },
          },
        });
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
                  title: newTaskTitle,
                  description: newTaskDescription,
                  subtasks: subtasks
                    .filter((subtask) => subtask.title)
                    .map((subtask) => ({ ...subtask, title: subtask.title || "Untitled Subtask" })),
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
      setSubtasks([{ title: "" }]); // Reset subtasks
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleAddSubtask = () => {
    setSubtasks([...subtasks, { title: "" }]);
  };

  const handleSubtaskChange = (index, value) => {
    const updatedSubtasks = subtasks.map((subtask, i) => (i === index ? { ...subtask, title: value } : subtask));
    setSubtasks(updatedSubtasks);
  };

  const handleRemoveSubtask = (index) => {
    const updatedSubtasks = subtasks.filter((_, i) => i !== index);
    setSubtasks(updatedSubtasks);
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;
  const boards = data.boards;

  return (
    <>
      <header
        className={`${
          isDarkMode ? "bg-custom-darkgray" : "bg-custom-white"
        } text-white p-4 pl-8 border-1 border-b-custom-red fixed w-full top-0 z-10`}
      >
        <div className="mx-auto flex gap-5 items-center">
          <div className="logo min-w-[235px]">
            <img src={isDarkMode ? logoLight : logoDark} alt="Logo" className="h-8" />
          </div>
          <div className="menu-wrapper flex items-center gap-5 justify-between w-[100%]">
            <p className={`font-bold text-2xl ${isDarkMode ? "text-custom-lightgray" : "text-custom-dark"}`}>
              {selectedBoard ? selectedBoard.name : "Platform Launch"}
            </p>
            <div className="nav-links flex items-center gap-4">
              <button className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6" onClick={toggleTaskModal}>
                + Add new task
              </button>
              <ThreeDotMenu />
            </div>
          </div>
        </div>
      </header>

      <div className="container">
        <div className="flex justify-left m-0 p-0 h-screen w-screen">
          <Sidebar toggleModal={toggleModal} boards={boards} onSelectBoard={setSelectedBoard} />
          {isModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
              <div className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
                <span className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={toggleModal}>
                  &times;
                </span>
                <h2 className="text-xl font-bold mb-4">Add New Board</h2>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Board Name
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    placeholder="e.g. Webdevelopment"
                    value={boardName}
                    onChange={(e) => setBoardName(e.target.value)}
                  />
                </label>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Board Columns
                  {newColumnNames.map((name, index) => (
                    <div key={index} className="flex items-center mb-4">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder={`Column ${index + 1}`}
                        value={name}
                        onChange={(e) => handleColumnNameChange(index, e.target.value)}
                      />
                      <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => handleRemoveColumnName(index)}>
                        &times;
                      </button>
                    </div>
                  ))}
                  <button className="w-full bg-custom-lightwhite text-custom-blue rounded-full p-3 pl-6 pr-6" onClick={handleAddColumnName}>
                    + Add New Column
                  </button>
                </label>
                <div className="space-y-4">
                  <button className="w-full bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6" onClick={handleCreateBoard}>
                    Create New Board
                  </button>
                </div>
              </div>
            </div>
          )}

          {isTaskModalOpen && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
              <div className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
                <span className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={toggleTaskModal}>
                  &times;
                </span>
                <h2 className="text-xl font-bold mb-4">Add New Task</h2>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Title
                  <input
                    type="text"
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    placeholder="e.g. Take Coffee Break"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                  />
                </label>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Description
                  <textarea
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                    placeholder="e.g. It’s always good to take a break. This 15 minute break will recharge the batteries a little."
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                  />
                </label>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Subtasks
                  {subtasks.map((subtask, index) => (
                    <div key={index} className="flex items-center mb-2">
                      <input
                        type="text"
                        className="w-full p-2 border border-gray-300 rounded"
                        placeholder={`Subtask ${index + 1}`}
                        value={subtask.title}
                        onChange={(e) => handleSubtaskChange(index, e.target.value)}
                      />
                      <button className="ml-2 text-red-500 hover:text-red-700" onClick={() => handleRemoveSubtask(index)}>
                        &times;
                      </button>
                    </div>
                  ))}
                  <button className="w-full bg-custom-lightwhite text-custom-blue rounded-full p-3 pl-6 pr-6" onClick={handleAddSubtask}>
                    + Add Subtask
                  </button>
                </label>
                <button className="w-full bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6" onClick={handleAddTask}>
                  Create Task
                </button>
              </div>
            </div>
          )}

          {selectedBoard && <BoardPage board={selectedBoard} />}
        </div>
      </div>
    </>
  );
}
