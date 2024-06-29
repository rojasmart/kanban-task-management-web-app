import { useState } from "react";
import { useMutation, gql } from "@apollo/client";

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(email: $email, password: $password) {
      token
    }
  }
`;

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, { data, loading, error }] = useMutation(LOGIN_MUTATION);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { data } = await login({ variables: { email, password } });
      console.log(data.login.token);
      // Store the token in local storage or handle it as needed
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-100">
      <form
        className="w-full max-w-xs bg-custom-white shadow-md rounded p-10 mb-4 border border-custom-darkwhite"
        onSubmit={handleLogin}
      >
        <input
          type="email"
          placeholder="Email"
          className="border border-custom-darkwhite rounded w-full max-w-xs mb-4 p-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="border border-custom-darkwhite rounded w-full max-w-xs mb-4 p-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="btn bg-custom-blue btn-primary w-full rounded text-custom-white p-2"
        >
          Login
        </button>
      </form>
      {error && <p className="text-red-600">Login error: {error.message}</p>}
    </div>
  );
};

export default Login;
