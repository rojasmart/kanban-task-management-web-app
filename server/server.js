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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Column",
    },
  ],
  items: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "KanbanItem",
    },
  ],
});

const User = mongoose.model("User", userSchema);
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
    items: [KanbanItem!]! # Add the items field here
  }

  type Column {
    id: ID!
    name: String!
    tasks: [Task!]!
  }

  type Task {
    id: ID!
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

  type KanbanItem {
    id: ID!
    title: String!
    description: String
    board: Board
  }

  type Query {
    me: User
    boards: [Board]
    board(id: ID!): Board
    kanbanItems: [KanbanItem]
    kanbanItem(id: ID!): KanbanItem
  }

  type Mutation {
    login(email: String!, password: String!): User
    register(email: String!, password: String!): User

    createBoard(
      name: String!
      description: String
      columns: [ColumnInput!]!
    ): Board

    createKanbanItem(
      title: String!
      description: String
      status: String
      boardId: ID!
    ): KanbanItem
    updateKanbanItem(
      id: ID!
      title: String
      description: String
      status: String
    ): KanbanItem
    deleteBoard(id: ID!): Board
    deleteKanbanItem(id: ID!): KanbanItem
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    me: (_, __, { user }) => {
      return user;
    },
    boards: async () => {
      const boards = await Board.find();
      return boards.map((board) => {
        if (!board.description) {
          // Option 1: Provide a default value
          board.description || "";

          // Option 2: Throw an error
          // throw new Error('Cannot return null for non-nullable field Board.description.');
        }
        return board;
      });
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

    createBoard: async (_, { name, description, columns }, { user }) => {
      if (!description) {
        // Option 1: Provide a default value
        description = "Default description";

        // Option 2: Throw an error
        // throw new Error('Description is required and cannot be null.');
      }

      const newBoard = new Board({ name, description, userId: user.userId });
      await newBoard.save();
      // Create initial columns
      for (const column of columns) {
        const newColumn = new Column({ ...column, board: newBoard._id });
        await newColumn.save();
        newBoard.columns.push(newColumn._id);
      }
      await newBoard.save();
      return newBoard.populate("columns");
    },

    createKanbanItem: (_, { title, description, status, boardId }) => {
      const newKanbanItem = new KanbanItem({
        title,
        description,
        status,
        board: boardId,
      });
      return newKanbanItem.save();
    },
    updateKanbanItem: (_, { id, title, description, status }) => {
      return KanbanItem.findByIdAndUpdate(
        id,
        { title, description, status },
        { new: true }
      );
    },
    deleteBoard: (_, { id }) => {
      return Board.findByIdAndRemove(id);
    },
    deleteKanbanItem: (_, { id }) => {
      return KanbanItem.findByIdAndRemove(id);
    },
  },
  Board: {
    items: (board) => KanbanItem.find({ board: board.id }),
  },
  KanbanItem: {
    board: (kanbanItem) => Board.findById(kanbanItem.board),
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
