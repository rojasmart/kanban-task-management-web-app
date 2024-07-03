export default function Home() {
  return (
    <>
      <header className="bg-gray-800 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="logo">
            <img src="../assets/logo-dark.svg" alt="Logo" className="h-8" />
          </div>
          <div className="flex space-x-4">
            <a href="#" className="hover:underline">
              Option 1
            </a>
            <a href="#" className="hover:underline">
              Option 2
            </a>
            <a href="#" className="hover:underline">
              Option 3
            </a>
          </div>
        </div>
        <div className="container mx-auto">
          <div className="flex flex-wrap justify-center">
            <p>This is home</p>
          </div>
        </div>
      </header>
    </>
  );
}
