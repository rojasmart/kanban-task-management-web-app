import { useParams, useOutletContext } from "react-router-dom";

function BoardPage() {
  let { boardId } = useParams();
  const { boards } = useOutletContext();

  const board = boards.find((b) => b.id === boardId);

  if (!board) return <p>Board not found</p>;

  return (
    <div>
      <h2>{board.name}</h2>
    </div>
  );
}

export default BoardPage;
