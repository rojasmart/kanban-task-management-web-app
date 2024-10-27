import PropTypes from "prop-types";
import { FaMoon, FaSun } from "react-icons/fa";

const ThemeToggle = ({ isDarkMode, toggleDarkMode }) => {
  return (
    <div className="theme-toggle-wrapper">
      <FaMoon className={`icon ${isDarkMode ? "inactive" : "active"}`} />
      <label className="switch">
        <input type="checkbox" checked={isDarkMode} onChange={toggleDarkMode} />
        <span className="slider round"></span>
      </label>
      <FaSun className={`icon ${isDarkMode ? "active" : "inactive"}`} />
    </div>
  );
};

ThemeToggle.propTypes = {
  isDarkMode: PropTypes.bool.isRequired,
  toggleDarkMode: PropTypes.func.isRequired,
};

export default ThemeToggle;
