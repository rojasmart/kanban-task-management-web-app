import { useParams } from "react-router-dom";
import { useQuery, gql } from "@apollo/client";
/* // Example data structure mapping board names to specific content
const boardContent = {
  "platform-launch": {
    title: "Board 1",
    description: "This is the first board",
    // Add more board-specific properties here
  },

  "marketing-plan": {
    title: "Board 2",
    description: "This is the second board",
    // Add more board-specific properties here
  },
  roadmap: {
    title: "Board 3",
    description: "This is the third board",
  },
};
 */
const GET_BOARDS = gql`
  query GetBoards {
    boards {
      id
      title
      description
    }
  }
`;

function BoardPage() {
  let { boardName } = useParams();

  const { loading, error, data } = useQuery(GET_BOARDS);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  // Debugging: Log the boardName to ensure it's being captured correctly
  console.log("Board Name:", boardName);

  /*  // Access specific board content using boardName
  const content = boardContent[boardName] || {
    title: "Board Not Found",
    description: "The specified board does not exist",
    // Default content if boardName does not match
  }; */

  const board = data.board;

  return (
    <div>
      <h2>{board.title}</h2>
      <p>{board.description}</p>
    </div>
  );
}

export default BoardPage;
