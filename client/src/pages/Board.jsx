import PropTypes from "prop-types";
import { useState, useEffect, useRef } from "react";
import { gql, useMutation } from "@apollo/client";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useTheme } from "../../themeContext";

const CREATE_COLUMN_MUTATION = gql`
  mutation createColumn($boardId: ID!, $name: String!) {
    createColumn(boardId: $boardId, name: $name) {
      id
      name
    }
  }
`;

const MOVE_TASK_MUTATION = gql`
  mutation moveTask($boardId: ID!, $sourceColumnName: String!, $destColumnName: String!, $taskIndex: Int!) {
    moveTask(boardId: $boardId, sourceColumnName: $sourceColumnName, destColumnName: $destColumnName, taskIndex: $taskIndex) {
      id
      name
      columns {
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

const UPDATE_SUBTASK_COMPLETION_MUTATION = gql`
  mutation updateSubtaskCompletion($boardId: ID!, $columnName: String!, $taskId: ID!, $subtaskId: ID!, $completed: Boolean!) {
    updateSubtaskCompletion(boardId: $boardId, columnName: $columnName, taskId: $taskId, subtaskId: $subtaskId, completed: $completed) {
      id
      title
      completed
    }
  }
`;

const UPDATE_TASK_MUTATION = gql`
  mutation updateTask($boardId: ID!, $columnName: String!, $taskId: ID!, $task: TaskInput!) {
    updateTask(boardId: $boardId, columnName: $columnName, taskId: $taskId, task: $task) {
      id
      title
      description
      subtasks {
        id
        title
        completed
      }
    }
  }
`;

const DELETE_TASK_MUTATION = gql`
  mutation deleteTask($boardId: ID!, $columnName: String!, $taskId: ID!) {
    deleteTask(boardId: $boardId, columnName: $columnName, taskId: $taskId) {
      id
      name
      columns {
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

const Board = ({ board }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [boardState, setBoardState] = useState(board);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createColumn] = useMutation(CREATE_COLUMN_MUTATION);
  const [moveTask] = useMutation(MOVE_TASK_MUTATION);
  const [updateSubtaskCompletion] = useMutation(UPDATE_SUBTASK_COMPLETION_MUTATION);
  const [updateTask] = useMutation(UPDATE_TASK_MUTATION);
  const [deleteTask] = useMutation(DELETE_TASK_MUTATION);

  const [isEditing, setIsEditing] = useState(false);
  const [editableTitle, setEditableTitle] = useState(selectedTask ? selectedTask.title : "");
  const [editableDescription, setEditableDescription] = useState(selectedTask ? selectedTask.description : "");
  const [editableSubtasks, setEditableSubtasks] = useState(selectedTask ? selectedTask.subtasks : []);

  const modalRef = useRef(null);

  const { isDarkMode } = useTheme();

  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  useEffect(() => {
    setBoardState(board);
  }, [board]);

  //logic to close the modal when clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setIsTaskModalOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [modalRef]);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleEditTask = async () => {
    if (!selectedTask || !selectedTask.id) {
      console.error("Selected task is not set or missing id");
      return;
    }

    const columnName = board.columns.find((col) => col.tasks.some((task) => task.id === selectedTask.id)).name;

    try {
      const updatedTask = {
        title: editableTitle,
        description: editableDescription,
        subtasks: editableSubtasks.map((subtask) => ({
          id: subtask.id,
          title: subtask.title,
          completed: subtask.completed,
        })),
      };

      await updateTask({
        variables: {
          boardId: board.id,
          columnName: columnName,
          taskId: selectedTask.id,
          task: updatedTask,
        },
      });

      console.log("Task updated successfully");
      setIsMenuVisible(false);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = () => {
    setIsModalDeleteOpen(true);
    isTaskModalOpen && setIsTaskModalOpen(false);
  };

  const confirmDeleteTask = async () => {
    if (!selectedTask || !selectedTask.id) {
      console.error("Selected task is not set or missing id");
      return;
    }

    const columnName = board.columns.find((col) => col.tasks.some((task) => task.id === selectedTask.id)).name;

    try {
      await deleteTask({
        variables: {
          boardId: board.id,
          columnName: columnName,
          taskId: selectedTask.id,
        },
      });

      console.log("Task deleted successfully");
      setBoardState((prevBoard) => ({
        ...prevBoard,
        columns: prevBoard.columns.map((column) => ({
          ...column,
          tasks: column.tasks.filter((task) => task.id !== selectedTask.id),
        })),
      }));
      setIsMenuVisible(false);
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Error deleting task:", error);
    }
    setIsModalDeleteOpen(false);
  };

  const cancelDeleteTask = () => {
    setIsModalDeleteOpen(false);
    setIsMenuVisible(false);
  };

  const handleCreateColumn = async () => {
    if (!newColumnName) {
      console.error("Column name is required");
      return;
    }
    try {
      const initialTasks = [
        {
          id: "1",
          title: "Sample Task",
          description: "Sample Description",
          subtasks: [{ title: "Sample Subtask" }],
        },
      ];

      const { data } = await createColumn({
        variables: {
          boardId: board.id,
          name: newColumnName,
        },
      });

      console.log("Server response:", data); // Log the server response
      const newColumn = data.createColumn;

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

  const onDragEnd = async (result) => {
    const { source, destination } = result;

    if (!destination) {
      return;
    }

    const sourceColumn = boardState.columns[source.droppableId];
    const destColumn = boardState.columns[destination.droppableId];
    const sourceTasks = [...sourceColumn.tasks];
    const destTasks = [...destColumn.tasks];
    const [removed] = sourceTasks.splice(source.index, 1);

    if (source.droppableId === destination.droppableId) {
      sourceTasks.splice(destination.index, 0, removed);
      const newColumn = {
        ...sourceColumn,
        tasks: sourceTasks,
      };
      const newColumns = [...boardState.columns];
      newColumns[source.droppableId] = newColumn;
      setBoardState((prevBoard) => ({
        ...prevBoard,
        columns: newColumns,
      }));
    } else {
      destTasks.splice(destination.index, 0, removed);
      const newSourceColumn = {
        ...sourceColumn,
        tasks: sourceTasks,
      };
      const newDestColumn = {
        ...destColumn,
        tasks: destTasks,
      };
      const newColumns = [...boardState.columns];
      newColumns[source.droppableId] = newSourceColumn;
      newColumns[destination.droppableId] = newDestColumn;
      setBoardState((prevBoard) => ({
        ...prevBoard,
        columns: newColumns,
      }));

      // Call the mutation to update the server
      await moveTask({
        variables: {
          boardId: board.id,
          sourceColumnName: sourceColumn.name,
          destColumnName: destColumn.name,
          taskIndex: source.index,
        },
      });
    }
  };

  const handleCardClick = (task) => {
    setSelectedTask(task);
    console.log("Selected Task:", task);
    setIsTaskModalOpen(true);
  };

  const handleSubtaskCompletionChange = async (subtaskIndex) => {
    console.log("Selected Task:", selectedTask);

    if (!selectedTask || !selectedTask.id) {
      console.error("Selected task is not set or missing id");
      return;
    }

    //edit the subtask completion locally
    setEditableSubtasks((prevSubtasks) =>
      prevSubtasks.map((subtask, index) => (index === subtaskIndex ? { ...subtask, completed: !subtask.completed } : subtask))
    );

    const updatedTask = {
      ...selectedTask,
      subtasks: selectedTask.subtasks.map((subtask, index) => (index === subtaskIndex ? { ...subtask, completed: !subtask.completed } : subtask)),
    };
    setSelectedTask(updatedTask);

    const subtask = updatedTask.subtasks[subtaskIndex];
    const columnName = board.columns.find((col) => col.tasks.some((task) => task.id === selectedTask.id)).name;

    console.log("Updating subtask completion with variables:", {
      boardId: board.id,
      columnName: columnName,
      taskId: selectedTask.id,
      subtaskId: subtask.id,
      completed: subtask.completed,
    });

    try {
      await updateSubtaskCompletion({
        variables: {
          boardId: board.id,
          columnName: columnName,
          taskId: selectedTask.id,
          subtaskId: subtask.id,
          completed: subtask.completed,
        },
      });
      console.log("Subtask completion updated successfully");
    } catch (error) {
      console.error("Error updating subtask completion:", error);
    }
  };

  const handleEditButtonClick = () => {
    setIsEditing(true);
    setEditableTitle(selectedTask.title);
    setEditableDescription(selectedTask.description);
    setEditableSubtasks(selectedTask.subtasks);
    toggleMenu();
  };

  const handleSaveChanges = async () => {
    if (!selectedTask || !selectedTask.id) {
      console.error("Selected task is not set or missing id");
      return;
    }

    const columnName = board.columns.find((col) => col.tasks.some((task) => task.id === selectedTask.id)).name;

    const stripTypename = (subtasks) => {
      return subtasks.map(({ __typename, ...subtask }) => subtask);
    };

    const updatedTask = {
      title: editableTitle,
      description: editableDescription,
      subtasks: stripTypename(editableSubtasks),
    };

    try {
      const { data } = await updateTask({
        variables: {
          boardId: board.id,
          columnName: columnName,
          taskId: selectedTask.id,
          task: updatedTask,
        },
      });

      console.log("Task updated successfully", data);

      // Update the local state with the updated task
      setBoardState((prevBoard) => {
        const updatedColumns = prevBoard.columns.map((column) => {
          if (column.name === columnName) {
            return {
              ...column,
              tasks: column.tasks.map((task) => (task.id === selectedTask.id ? { ...task, ...updatedTask } : task)),
            };
          }
          return column;
        });

        return {
          ...prevBoard,
          columns: updatedColumns,
        };
      });

      setIsEditing(false);
      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleAddSubtask = () => {
    setEditableSubtasks([...editableSubtasks, { title: "", completed: false }]);
  };

  const handleRemoveSubtask = (index) => {
    const newSubtasks = editableSubtasks.filter((_, subtaskIndex) => subtaskIndex !== index);
    setEditableSubtasks(newSubtasks);
  };

  const handleMoveTask = async (destColumnName) => {
    if (!selectedTask || !selectedTask.id || !destColumnName) {
      console.error("Selected task or destination column is not set");
      return;
    }

    const sourceColumnName = board.columns.find((col) => col.tasks.some((task) => task.id === selectedTask.id)).name;

    try {
      await moveTask({
        variables: {
          boardId: board.id,
          sourceColumnName: sourceColumnName,
          destColumnName: destColumnName,
          taskIndex: board.columns.find((col) => col.name === sourceColumnName).tasks.findIndex((task) => task.id === selectedTask.id),
        },
      });

      // Update the local state to reflect the change
      setBoardState((prevBoard) => {
        const sourceColumn = prevBoard.columns.find((col) => col.name === sourceColumnName);
        const destColumn = prevBoard.columns.find((col) => col.name === destColumnName);
        const task = sourceColumn.tasks.find((task) => task.id === selectedTask.id);

        return {
          ...prevBoard,
          columns: prevBoard.columns.map((col) => {
            if (col.name === sourceColumnName) {
              return {
                ...col,
                tasks: col.tasks.filter((task) => task.id !== selectedTask.id),
              };
            }
            if (col.name === destColumnName) {
              return {
                ...col,
                tasks: [...col.tasks, task],
              };
            }
            return col;
          }),
        };
      });

      setIsTaskModalOpen(false);
    } catch (error) {
      console.error("Error moving task:", error);
    }
  };

  return (
    <div className="board p-4 mt-16">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns flex space-x-4 h-screen">
          {boardState.columns.map((column, columnIndex) => (
            <Droppable key={columnIndex} droppableId={`${columnIndex}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="column flex-shrink-0 w-64 bg-gray-100 p-4 rounded-lg">
                  <h4 className="text-md font-bold mb-3 text-custom-lightgray">
                    {column.name}({column.tasks.length})
                  </h4>
                  <div className="tasks space-y-4">
                    {column.tasks && column.tasks.length > 0 ? (
                      column.tasks.map((task, taskIndex) => (
                        <Draggable key={taskIndex} draggableId={`${columnIndex}-${taskIndex}`} index={taskIndex} cl>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`${isDarkMode ? "bg-custom-darkgray" : "bg-custom-white"} shadow-md rounded-lg p-4`}
                              onClick={() => handleCardClick(task)}
                              data-id={task.id} // Pass the task id here
                            >
                              <h4 className={`${isDarkMode ? "text-custom-darkwhite" : "text-custom-darkgray"} font-bold`}>{task.title}</h4>
                              {task.subtasks && task.subtasks.length > 0 && (
                                <ul className="subtasks list-disc mt-2">
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <p className="subtasks-count text-xs text-custom-lightgray font-semibold">
                                      {task.subtasks.filter((subtask) => subtask.completed).length} of {task.subtasks.length} subtasks
                                    </p>
                                  )}
                                </ul>
                              )}
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <div className="p-4 rounded-lg border-dashed border-2 border-custom-lightgray h-screen"></div>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}

          <div className="column h-full flex-shrink-0 w-64 bg-custom-darkwhite rounded-lg flex items-center justify-center mt-12 overflow-hidden">
            <p className="text-custom-lightgray text-2xl cursor-pointer font-semibold" onClick={toggleModal}>
              + New column
            </p>
          </div>
        </div>
      </DragDropContext>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <span className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={toggleModal}>
              &times;
            </span>
            <h2 className="text-xl font-bold mb-4">Add New Column</h2>
            <input
              type="text"
              className="w-full text-xs p-2 border border-custom-darkwhite focus:border-custom-blue focus:outline-none focus:border-2 rounded mb-4"
              placeholder="Column Name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <button className="w-full bg-custom-blue font-bold text-custom-white rounded-full p-3 pl-6 pr-6" onClick={handleCreateColumn}>
              Create Column
            </button>
          </div>
        </div>
      )}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div ref={modalRef} className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <div className="absolute top-4 right-4">
              <button onClick={toggleMenu} className="text-3xl">
                <BsThreeDotsVertical className="text-gray-500 hover:text-gray-700" />
              </button>
              {isMenuVisible && (
                <div className="absolute right-0 mt-2 w-48 bg-custom-white dark:bg-gray-800 shadow-md rounded-md py-1">
                  <button onClick={handleEditButtonClick} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Edit Task
                  </button>
                  <button onClick={handleDeleteTask} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-custom-red">
                    Delete Task
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <>
                <label className="block text-sm font-bold text-custom-lightgray">Title</label>
                <input
                  type="text"
                  value={editableTitle}
                  onChange={(e) => setEditableTitle(e.target.value)}
                  className="text-xs mb-2 mt-2 w-full border border-custom-darkwhite rounded-md p-2  focus:border-custom-blue focus:outline-none focus:border-2"
                />
                <label className="block text-sm font-bold text-custom-lightgray">Description</label>
                <textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  className="text-sm  mt-2 w-full border border-custom-darkwhite focus:border-custom-blue focus:outline-none focus:border-2 rounded-md p-2"
                />
                <p className="text-sm text-custom-lightgray font-semibold mb-2 mt-2">
                  Subtasks ({editableSubtasks.filter((subtask) => subtask.completed).length} of {editableSubtasks.length})
                </p>
                <ul className="subtasks list-none">
                  {editableSubtasks.map((subtask, subtaskIndex) => (
                    <li key={subtaskIndex} className="subtask bg-custom-lightwhite rounded-lg p-2 mb-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleSubtaskCompletionChange(subtaskIndex)}
                        className="mr-2 cursor-pointer "
                        style={{ width: "15px", height: "15px" }}
                      />
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) => {
                          const newSubtasks = editableSubtasks.map((subtask, index) =>
                            index === subtaskIndex ? { ...subtask, title: e.target.value } : subtask
                          );
                          setEditableSubtasks(newSubtasks);
                        }}
                        className={`m-0 text-xs ${
                          subtask.completed ? "line-through" : ""
                        } border border-custom-darkwhite focus:border-custom-blue focus:outline-none focus:border-2 rounded-md p-2 w-full`}
                      />
                      <button onClick={() => handleRemoveSubtask(subtaskIndex)} className="ml-2 text-custom-red">
                        &times;
                      </button>
                    </li>
                  ))}
                </ul>
                <button onClick={handleAddSubtask} className="mt-2 bg-custom-blue text-custom-white px-4 py-2 rounded-full w-full block">
                  + Add New Subtask
                </button>
                <button onClick={handleSaveChanges} className="mt-4 bg-custom-blue text-custom-white px-4 py-2 rounded-full w-full block">
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2 mt-2">{selectedTask.title}</h2>
                <p className="text-md text-custom-lightgray">{selectedTask.description}</p>
                <p className="text-xs text-custom-lightgray font-semibold mb-2 mt-2">
                  Subtasks ({selectedTask.subtasks.filter((subtask) => subtask.completed).length} of {selectedTask.subtasks.length})
                </p>
                <ul className="subtasks list-none">
                  {selectedTask.subtasks.map((subtask, subtaskIndex) => (
                    <li key={subtaskIndex} className="subtask bg-custom-lightwhite rounded-lg p-2 mb-2 flex items-center">
                      <input
                        type="checkbox"
                        checked={subtask.completed}
                        onChange={() => handleSubtaskCompletionChange(subtaskIndex)}
                        className="mr-2 cursor-pointer"
                        style={{ width: "15px", height: "15px" }}
                      />
                      <p className={`m-0 text-xs font-semibold ${subtask.completed ? "line-through" : ""}`}>{subtask.title}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-4">
                  <label className="text-xs text-custom-lightgray font-semibold">Current Status</label>
                  <select
                    className="cursor-pointer mt-1 block w-full pl-3 pr-10 py-2 text-xs border border-custom-darkwhite focus:border-custom-blue focus:outline-none focus:border-2 rounded-md"
                    onChange={(e) => handleMoveTask(e.target.value)}
                  >
                    <option value="">Select Column</option>
                    {board.columns.map((column) => (
                      <option key={column.name} value={column.name}>
                        {column.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {isModalDeleteOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <button onClick={cancelDeleteTask} className="absolute top-2 right-2 text-gray-500 hover:text-gray-700">
              &times;
            </button>
            <h4 className="text-md font-bold mb-4 text-custom-red">Delete Task</h4>
            <p className="mb-4 text-sm text-custom-lightgray">
              Are you sure you want to delete this board? This action will remove all columns and tasks and cannot be reversed.
            </p>
            <div className="flex justify-end space-x-4">
              <button onClick={confirmDeleteTask} className="px-4 py-2 bg-custom-red text-custom-white font-bold  rounded-full w-full block">
                Delete
              </button>
              <button onClick={cancelDeleteTask} className="px-4 py-2 bg-custom-darkwhite text-custom-blue font-bold rounded-full w-full block">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

Board.propTypes = {
  board: PropTypes.object.isRequired,
};

export default Board;
