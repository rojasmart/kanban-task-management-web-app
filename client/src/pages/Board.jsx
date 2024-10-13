import PropTypes from "prop-types";
import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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

const Board = ({ board }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [boardState, setBoardState] = useState(board);
  const [createColumn] = useMutation(CREATE_COLUMN_MUTATION);

  const toggleModal = () => setIsModalOpen(!isModalOpen);

  const handleCreateColumn = async () => {
    if (!newColumnName) {
      console.error("Column name is required");
      return;
    }
    try {
      const { data } = await createColumn({
        variables: {
          boardId: board.id,
          name: newColumnName,
        },
      });
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

  const onDragEnd = (result) => {
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
    }
  };

  return (
    <div className="board p-4">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="columns flex space-x-4 overflow-x-auto">
          {boardState.columns.map((column, columnIndex) => (
            <Droppable key={columnIndex} droppableId={`${columnIndex}`}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="column flex-shrink-0 w-64 bg-gray-100 p-4 rounded-lg"
                >
                  <h3 className="text-xl font-bold mb-4">{column.name}</h3>
                  <div className="tasks space-y-4">
                    {column.tasks && column.tasks.length > 0 ? (
                      column.tasks.map((task, taskIndex) => (
                        <Draggable
                          key={taskIndex}
                          draggableId={`${columnIndex}-${taskIndex}`}
                          index={taskIndex}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="bg-custom-white shadow-md rounded-lg p-4"
                            >
                              <h4 className="font-bold">{task.title}</h4>
                              <p>{task.description}</p>
                            </div>
                          )}
                        </Draggable>
                      ))
                    ) : (
                      <p>No tasks available</p>
                    )}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
          <div className="column flex-shrink-0 w-64 bg-custom-darkwhite p-4 rounded-lg flex items-center justify-center">
            <p
              className="text-custom-lightgray text-2xl cursor-pointer font-semibold"
              onClick={toggleModal}
            >
              + New column
            </p>
          </div>
        </div>
      </DragDropContext>
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div className="relative bg-custom-white dark:bg-gray-800 rounded-lg shadow-lg w-full max-w-lg p-6">
            <span
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 cursor-pointer"
              onClick={toggleModal}
            >
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
            <button
              className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6"
              onClick={handleCreateColumn}
            >
              Create Column
            </button>
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
