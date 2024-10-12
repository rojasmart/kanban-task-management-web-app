import PropTypes from "prop-types";

const Board = ({ board }) => {
  return (
    <div className="board">
      <h2>{board.name}</h2>
      <div className="columns">
        {board.columns.map((column, columnIndex) => (
          <div key={columnIndex} className="column">
            <h3>{column.name}</h3>
            <div className="tasks">
              {column.tasks.map((task, taskIndex) => (
                <div
                  key={taskIndex}
                  className="bg-custom-white task-card bg-white shadow-md rounded-lg p-4 mb-4"
                >
                  <h4 className="font-bold">{task.title}</h4>
                  <p>{task.description}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Board;

Board.propTypes = {
  board: PropTypes.object.isRequired,
};
