import Board from "./Board";
import PropTypes from "prop-types";

function BoardPage({ board }) {
  if (!board) return <p>Board not found</p>;

  return (
    <div>
      <h2>{board.name}</h2>
      <p>{board.description}</p>
      <Board board={board} />
    </div>
  );
}

export default BoardPage;

BoardPage.propTypes = {
  board: PropTypes.object,
};
