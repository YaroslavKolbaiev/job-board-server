import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { authMiddleware, handleLogin } from './auth.js';
import { resolvers } from './resolvers.js';
import { readFile } from 'fs/promises';

const PORT = 9000;

const app = express();
app.use(
  cors(),
  /** middleware parsing json string into JS object */
  express.json(),
  authMiddleware
);

app.post('/login', handleLogin);

const typeDefs = await readFile('./schema.graphql', 'utf-8');

/** create instance of apollo server */
const apolloServer = new ApolloServer({ typeDefs, resolvers });

/** Run apollo server */
await apolloServer.start();

/** apply expressMiddleware to a specific path */
app.use('/graphql', expressMiddleware(apolloServer));

app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
});
