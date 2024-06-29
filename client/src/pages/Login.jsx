import { useState } from "react";
import { gql, useMutation } from "@apollo/client";
import { useNavigate, Link } from "react-router-dom";

const LOGIN_MUTATION = gql`
  mutation login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { data, loading, error }] = useMutation(LOGIN_MUTATION);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const { data } = await login({ variables: { email, password } });
    localStorage.setItem("token", data.login.token);
    navigate("/");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-100">
      <form
        className="w-full max-w-xs bg-custom-white shadow-md rounded p-10 mb-4 border border-custom-darkwhite"
        onSubmit={handleLogin}
      >
        <div className="mb-4">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            type="email"
            placeholder="Email"
            className="border border-custom-darkwhite rounded w-full max-w-xs mb-4 p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-700 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            type="password"
            placeholder="Password"
            className="border border-custom-darkwhite rounded w-full max-w-xs mb-4 p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="btn bg-custom-blue btn-primary w-full rounded text-custom-white p-2"
        >
          Login
        </button>
      </form>
      {error && <p className="text-red-600">Login error: {error.message}</p>}
      {/* Add Link to Register below */}
      <p className="mt-4">
        Dont have an account?
        <Link to="/register" className="text-blue-500 hover:text-blue-700">
          Register
        </Link>
      </p>
    </div>
  );
};

export default Login;
