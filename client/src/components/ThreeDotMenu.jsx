import { useState } from "react";
import { BsThreeDotsVertical } from "react-icons/bs";
import { useNavigate } from "react-router-dom";

function ThreeDotMenu() {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuVisible(!isMenuVisible);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="relative">
      <button onClick={toggleMenu} className="text-3xl">
        <BsThreeDotsVertical className={"text-custom-lightgray"} />
      </button>
      {isMenuVisible && (
        <div className="absolute right-0 mt-2 w-48 bg-custom-white shadow-md rounded-md py-1">
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">
            Option 1
          </a>
          <a href="#" className="block px-4 py-2 hover:bg-gray-100">
            Option 2
          </a>
          <a
            href="#"
            onClick={handleLogout}
            className="block px-4 py-2 hover:bg-gray-100 text-custom-red"
          >
            Logout
          </a>
        </div>
      )}
    </div>
  );
}

export default ThreeDotMenu;
