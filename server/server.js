const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");
require("dotenv").config();

// Define CORS options
const corsOptions = {
  origin: ["http://localhost:5173/", "http://localhost:4000/graphql"], // Specify allowed domains
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allowed HTTP methods
  credentials: true, // Allow cookies to be sent
};

const app = express();

// Apply CORS middleware with options
app.use(cors(corsOptions));

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
});

const User = mongoose.model("User", userSchema);

// GraphQL type definitions
const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    token: String
  }

  type Query {
    me: User
  }

  type Mutation {
    login(email: String!, password: String!): User
    register(email: String!, password: String!): User
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      return user;
    },
  },
  Mutation: {
    register: async (_, { email, password }) => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({ email, password: hashedPassword });
      await user.save();
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      return { id: user.id, email: user.email, token };
    },
    login: async (_, { email, password }) => {
      console.log("Login attempt with email:", email);
      const user = await User.findOne({ email });
      if (!user) {
        console.error("User not found");
        throw new Error("User not found");
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        console.error("Incorrect password");
        throw new Error("Incorrect password");
      }
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      console.log("Generated JWT token:", token);
      return { id: user.id, email: user.email, token };
    },
  },
};

const getUser = async (token) => {
  try {
    if (token) {
      const { userId } = jwt.verify(token, process.env.JWT_SECRET);
      return await User.findById(userId);
    }
  } catch (e) {
    console.error("Session expired:", e);
    throw new Error("Your session expired. Sign in again.");
  }
};

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: async ({ req }) => {
      const token = req.headers.authorization || "";
      const user = await getUser(token);
      return { user };
    },
  });

  await server.start();
  server.applyMiddleware({ app, cors: false });

  mongoose
    .connect(process.env.MONGODB_URI, {})
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.error("MongoDB connection error:", err));

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
};

startServer();
