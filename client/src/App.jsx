import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import BoardPage from "./pages/BoardPage";
import { ThemeProvider } from "../themeProvider";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Adjust Home route to act as a layout for nested routes */}
          <Route path="/home" element={<Home />}>
            {/* Nested route for BoardPage */}
            <Route path="board/:boardName" element={<BoardPage />} />
          </Route>
          {/* Other routes */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
