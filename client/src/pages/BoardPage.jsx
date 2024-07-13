import { useParams } from "react-router-dom";

function BoardPage() {
  let { boardName } = useParams();

  return (
    <div>
      <h1>{boardName.replace(/-/g, " ")}</h1>
      hello
    </div>
  );
}

export default BoardPage;
