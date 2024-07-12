import { useParams } from "react-router-dom";

function BoardPage() {
  let { boardName } = useParams();

  return (
    <div>
      <h1>{boardName.replace(/-/g, " ")}</h1>
      {/* Display board content here */}
    </div>
  );
}

export default BoardPage;
