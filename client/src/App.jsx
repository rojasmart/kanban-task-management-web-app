import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import { ThemeProvider } from "../themeProvider";

import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<Home />} />
          {/* Other routes */}
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
