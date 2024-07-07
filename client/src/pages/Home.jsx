import logoDark from "../assets/logo-dark.svg";
import Sidebar from "../components/Sidebar";
import ThreeDotMenu from "../components/ThreeDotMenu";

export default function Home() {
  return (
    <>
      <header className="bg-custom-white text-white p-4 border-1 border-b-custom-red">
        <div className="container mx-auto flex justify-between items-center">
          <div className="logo">
            <img src={logoDark} alt="Logo" className="h-8" />
          </div>
          <div className="nav-links flex items-center gap-4">
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
          <Sidebar />
        </div>
      </div>
    </>
  );
}
