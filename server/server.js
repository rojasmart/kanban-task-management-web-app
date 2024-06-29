const { ApolloServer, gql } = require("apollo-server-express");
const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cors = require("cors");

const app = express();
app.use(cors());

// MongoDB User model
const User = mongoose.model(
  "User",
  new mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
  })
);

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
      const token = jwt.sign({ userId: user.id }, "SECRET");
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
      const token = jwt.sign({ userId: user.id }, "SECRET");
      return { id: user.id, email: user.email, token };
    },
  },
};

const getUser = async (token) => {
  try {
    if (token) {
      const { userId } = jwt.verify(token, "SECRET");
      return await User.findById(userId);
    }
  } catch (e) {
    throw new Error("Your session expired. Sign in again.");
  }
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    const token = req.headers.authorization || "";
    const user = await getUser(token);
    return { user };
  },
});

server.applyMiddleware({ app });

mongoose.connect("mongodb://localhost/kanban", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

app.listen({ port: 4000 }, () =>
  console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
);
