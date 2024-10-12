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

//Column Schema
const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tasks: [
    {
      title: {
        type: String,
        required: true,
      },
      description: String,
    },
  ],
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },
});

// Schema for Kanban Items
const kanbanItemSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  status: {
    type: String,
    enum: ["todo", "in progress", "done"],
    default: "todo",
  },
  board: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Board",
    required: true,
  },
});

// Schema for Boards
const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  columns: [
    {
      name: {
        type: String,
        required: true,
      },
      tasks: [
        {
          title: {
            type: String,
            required: true,
          },
          description: String,
        },
      ],
    },
  ],
});
const User = mongoose.model("User", userSchema);
const Column = mongoose.model("Column", columnSchema);
const KanbanItem = mongoose.model("KanbanItem", kanbanItemSchema);
const Board = mongoose.model("Board", boardSchema);

// GraphQL type definitions
const typeDefs = gql`
  type User {
    id: ID!
    email: String!
    token: String
  }

  type Board {
    id: ID!
    name: String!
    description: String
    columns: [Column!]!
  }

  type Column {
    name: String
    tasks: [Task!]!
  }

  type Task {
    title: String!
    description: String
  }

  input TaskInput {
    title: String!
    description: String
  }

  input ColumnInput {
    name: String!
    tasks: [TaskInput!]!
  }

  type Query {
    me: User
    boards: [Board]
    board(id: ID!): Board
  }

  type Mutation {
    login(email: String!, password: String!): User
    register(email: String!, password: String!): User

    createBoard(
      name: String!
      description: String
      columns: [ColumnInput!]!
    ): Board

    addTaskToColumn(boardId: ID!, columnName: String!, task: TaskInput!): Board
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      return user;
    },
    boards: async () => {
      return Board.find();
    },
    board: async (_, { id }) => {
      return Board.findById(id);
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
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error("User not found");
      }
      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        throw new Error("Incorrect password");
      }
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);
      return { id: user.id, email: user.email, token };
    },

    createBoard: async (_, { name, description, columns }) => {
      // Ensure columns have valid names
      const validColumns = columns.map((column) => {
        if (!column.name) {
          throw new Error("Column name is required");
        }
        return column;
      });

      const newBoard = new Board({ name, description, columns: validColumns });
      await newBoard.save();
      return newBoard;
    },

    addTaskToColumn: async (_, { boardId, columnName, task }) => {
      const board = await Board.findById(boardId);
      const column = board.columns.find((col) => col.name === columnName);
      if (!column) {
        throw new Error("Column not found");
      }
      column.tasks.push(task);
      await board.save();
      return board;
    },
  },
};

const getUser = async (token) => {
  try {
    if (token) {
      return jwt.verify(token, process.env.JWT_SECRET);
    }
    return null;
  } catch (err) {
    console.error("Token verification error:", err);
    return null;
  }
};

const startServer = async () => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => {
      const token = req.headers.authorization || "";
      const user = getUser(token);
      if (!user) {
        throw new Error("Your session expired. Sign in again.");
      }
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
