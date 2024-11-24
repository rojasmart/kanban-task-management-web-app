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

//Subtask Schema
const subtaskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);
//Task Scheme
const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  description: String,
  subtasks: [subtaskSchema],
});

//Column Schema
const columnSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  tasks: [taskSchema],
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
          subtasks: [
            {
              title: {
                type: String,
                required: true,
              },
              _id: {
                type: mongoose.Schema.Types.ObjectId,
                default: () => new mongoose.Types.ObjectId(),
              },
            },
          ],
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
    columns: [Column!]!
  }

  type Column {
    name: String
    tasks: [Task!]!
  }

  type Task {
    id: ID
    title: String!
    description: String!
    subtasks: [Subtask!]
  }

  type Subtask {
    id: ID
    title: String!
    completed: Boolean!
  }

  input TaskInput {
    title: String!
    description: String
    subtasks: [SubtaskInput!]
  }

  input SubtaskInput {
    title: String!
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
    createBoard(name: String!, columns: [ColumnInput!]!): Board
    addTaskToColumn(boardId: ID!, columnName: String!, task: TaskInput!): Board
    createSubtask(boardId: ID!, columnName: String!, taskId: ID!, subtask: SubtaskInput!): Task
    createColumn(boardId: ID!, name: String!): Column
    moveTask(boardId: ID!, sourceColumnName: String!, destColumnName: String!, taskIndex: Int!): Board
    updateSubtaskCompletion(boardId: ID!, columnName: String!, taskId: ID!, subtaskId: ID!, completed: Boolean!): Subtask
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

    createBoard: async (_, { name, columns }) => {
      const validColumns = columns.map((column) => {
        if (!column.name) {
          throw new Error("Column name is required");
        }
        return {
          ...column,
          tasks: column.tasks.map((task) => ({
            ...task,
            subtasks: task.subtasks ? task.subtasks.map((subtask) => ({ id: new mongoose.Types.ObjectId(), title: subtask.title })) : [],
          })),
        };
      });

      const newBoard = new Board({ name, columns: validColumns });
      await newBoard.save();
      return newBoard;
    },

    addTaskToColumn: async (_, { boardId, columnName, task }) => {
      console.log(`addTaskToColumn called with boardId: ${boardId}, columnName: ${columnName}, task: ${JSON.stringify(task, null, 2)}`);

      const board = await Board.findById(boardId);
      if (!board) {
        console.error("Board not found");
        throw new Error("Board not found");
      }
      console.log(`Board found: ${board.name}`);

      const column = board.columns.find((col) => col.name === columnName);
      if (!column) {
        console.error("Column not found");
        throw new Error("Column not found");
      }
      console.log(`Column found: ${column.name}`);

      const newTask = {
        ...task,
        subtasks: task.subtasks ? task.subtasks.map((subtask) => ({ id: new mongoose.Types.ObjectId(), title: subtask.title })) : [],
      };
      console.log("New Task server:", JSON.stringify(newTask, null, 2));

      column.tasks.push(newTask);

      await board.save();
      console.log("Board saved successfully");

      // Fetch the updated board to ensure the response is correct
      const updatedBoard = await Board.findById(boardId).lean();
      if (!updatedBoard) {
        console.error("Updated board not found");
        throw new Error("Updated board not found");
      }

      updatedBoard.columns = updatedBoard.columns.map((col) => {
        if (col.name === columnName) {
          col.tasks = col.tasks.map((t) => {
            if (t.title === newTask.title) {
              t.subtasks = newTask.subtasks;
            }
            return t;
          });
        }
        return col;
      });

      console.log("Updated Board:", JSON.stringify(updatedBoard, null, 2));

      return {
        id: updatedBoard._id.toString(),
        name: updatedBoard.name,
        columns: updatedBoard.columns,
      };
    },

    createSubtask: async (_, { boardId, columnName, taskId, subtask }) => {
      const board = await Board.findById(boardId);
      if (!board) {
        throw new Error("Board not found");
      }

      const column = board.columns.find((col) => col.name === columnName);
      if (!column) {
        throw new Error("Column not found");
      }

      const task = column.tasks.id(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      if (!task.subtasks) {
        task.subtasks = []; // Initialize the subtasks array if it is undefined
      }

      task.subtasks.push({ id: new mongoose.Types.ObjectId(), ...subtask });
      await board.save();
      return task;
    },

    updateSubtaskCompletion: async (_, { boardId, columnName, taskId, subtaskId, completed }) => {
      const board = await Board.findById(boardId);
      if (!board) {
        throw new Error("Board not found");
      }

      const column = board.columns.find((col) => col.name === columnName);
      if (!column) {
        throw new Error("Column not found");
      }

      const task = column.tasks.id(taskId);
      if (!task) {
        throw new Error("Task not found");
      }

      const subtask = task.subtasks.id(subtaskId);
      if (!subtask) {
        throw new Error("Subtask not found");
      }

      subtask.completed = completed;
      await board.save();
      return subtask;
    },

    createColumn: async (_, { boardId, name }) => {
      const board = await Board.findById(boardId);
      if (!board) {
        throw new Error("Board not found");
      }
      const newColumn = { name, tasks: [] };
      board.columns.push(newColumn);
      await board.save();
      return newColumn;
    },

    moveTask: async (_, { boardId, sourceColumnName, destColumnName, taskIndex }) => {
      const board = await Board.findById(boardId);
      if (!board) {
        throw new Error("Board not found");
      }

      const sourceColumn = board.columns.find((col) => col.name === sourceColumnName);
      const destColumn = board.columns.find((col) => col.name === destColumnName);

      if (!sourceColumn || !destColumn) {
        throw new Error("Column not found");
      }

      const [task] = sourceColumn.tasks.splice(taskIndex, 1);
      destColumn.tasks.push(task);

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

  app.listen({ port: 4000 }, () => console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`));
};

startServer();
