import Board from "./Board";

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
