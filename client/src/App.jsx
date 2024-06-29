import Login from "./pages/Login";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        {/* Other routes */}
      </Routes>
    </Router>
  );
}

export default App;
