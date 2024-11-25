import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import { gql, useMutation } from "@apollo/client";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

const CREATE_COLUMN_MUTATION = gql`
  mutation createColumn($boardId: ID!, $name: String!, $tasks: [TaskInput!]) {
    createColumn(boardId: $boardId, name: $name, tasks: $tasks) {
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
            completed
          }
        }
      }
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

const Board = ({ board }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [boardState, setBoardState] = useState(board);
  const [selectedTask, setSelectedTask] = useState(null);
  const [createColumn] = useMutation(CREATE_COLUMN_MUTATION);
  const [moveTask] = useMutation(MOVE_TASK_MUTATION);
  const [updateSubtaskCompletion] = useMutation(UPDATE_SUBTASK_COMPLETION_MUTATION);

  useEffect(() => {
    setBoardState(board);
  }, [board]);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

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
          boardId: selectedBoard.id,
          name: newColumnName,
          tasks: initialTasks,
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

  return (
    <div className="board p-4 mt-16">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns flex space-x-4 overflow-x-auto h-screen">
          {boardState.columns.map((column, columnIndex) => (
            <Droppable key={columnIndex} droppableId={`${columnIndex}`}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="column flex-shrink-0 w-64 bg-gray-100 p-4 rounded-lg">
                  <h3 className="text-xl font-bold mb-4">{column.name}</h3>
                  <div className="tasks space-y-4">
                    {column.tasks && column.tasks.length > 0 ? (
                      column.tasks.map((task, taskIndex) => (
                        <Draggable key={taskIndex} draggableId={`${columnIndex}-${taskIndex}`} index={taskIndex}>
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-custom-white shadow-md rounded-lg p-4"
                              onClick={() => handleCardClick(task)}
                              data-id={task.id} // Pass the task id here
                            >
                              <h4 className="font-bold">{task.title}</h4>
                              <p>{task.description}</p>

                              {task.subtasks && task.subtasks.length > 0 && (
                                <ul className="subtasks list-disc pl-5">
                                  {task.subtasks && task.subtasks.length > 0 && (
                                    <p className="subtasks-count">
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
          <div className="column h-full flex-shrink-0 w-64 bg-custom-darkwhite p-4 rounded-lg flex items-center justify-center">
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
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Column Name"
              value={newColumnName}
              onChange={(e) => setNewColumnName(e.target.value)}
            />
            <button className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6" onClick={handleCreateColumn}>
              Create Column
            </button>
          </div>
        </div>
      )}
      {isTaskModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <span className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer" onClick={() => setIsTaskModalOpen(false)}>
              &times;
            </span>
            <h2 className="text-xl font-bold mb-4">{selectedTask.title}</h2>
            <p>{selectedTask.description}</p>
            <ul className="subtasks list-disc pl-5">
              {selectedTask.subtasks &&
                selectedTask.subtasks.length > 0 &&
                selectedTask.subtasks.map((subtask, subtaskIndex) => (
                  <li key={subtaskIndex} className="subtask">
                    <input type="checkbox" checked={subtask.completed} onChange={() => handleSubtaskCompletionChange(subtaskIndex)} />
                    {subtask.title}
                  </li>
                ))}
            </ul>
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
