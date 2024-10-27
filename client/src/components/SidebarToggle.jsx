import { FaEye, FaEyeSlash } from "react-icons/fa";
import PropTypes from "prop-types";

const SidebarToggle = ({ isOpen, toggleSidebar }) => {
  return (
    <button className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6 toggle-btn flex items-center" onClick={toggleSidebar}>
      {isOpen ? (
        <>
          <FaEyeSlash className="mr-2" /> Hide Sidebar
        </>
      ) : (
        <>
          <FaEye className="mr-2" /> Show Sidebar
        </>
      )}
    </button>
  );
};

SidebarToggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  toggleSidebar: PropTypes.func.isRequired,
};

export default SidebarToggle;
