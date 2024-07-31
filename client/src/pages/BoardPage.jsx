import { useParams } from "react-router-dom";

// Example data structure mapping board names to specific content
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

function BoardPage() {
  let { boardName } = useParams();

  // Debugging: Log the boardName to ensure it's being captured correctly
  console.log("Board Name:", boardName);

  // Access specific board content using boardName
  const content = boardContent[boardName] || {
    title: "Board Not Found",
    description: "The specified board does not exist",
    // Default content if boardName does not match
  };

  // Debugging: Log the content to ensure it's what you expect
  console.log("Content:", content);

  return (
    <div>
      <h1>{content.title.replace(/-/g, " ")}</h1>
      <p>{content.description}</p>
      {/* Render more board-specific content here */}
    </div>
  );
}

export default BoardPage;
