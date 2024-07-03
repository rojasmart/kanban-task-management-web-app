import logoDark from "../assets/logo-dark.svg";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function Home() {
  return (
    <>
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="logo">
            <img src={logoDark} alt="Logo" className="h-8" />
          </div>
          <div className="nav-links flex items-center">
            <button className="bg-custom-blue text-custom-white rounded-full p-3 pl-6 pr-6">
              Add new task
            </button>
            <ThreeDotMenu />
          </div>
        </div>
      </header>
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center">
          <p>This is home</p>
        </div>
      </div>
    </>
  );
}
