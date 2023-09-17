import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import express from 'express';
import { authMiddleware, handleLogin } from './auth.js';
import { resolvers } from './resolvers.js';
import { readFile } from 'fs/promises';
import { getUser } from './db/users.js';
import { createCompanyLoader } from './db/companies.js';

const PORT = 9000;

const app = express();
app.use(
  cors(),
  /** middleware parsing json string into JS object */
  express.json(),
  // defines jwt logic for express middleware
  authMiddleware
);

app.post('/login', handleLogin);

const typeDefs = await readFile('./schema.graphql', 'utf-8');

// getContex function rcvs req and res agrs from express middleware
async function getContext({ req, res }) {
  // the logic to call companyloader instance in context
  // is to avoid global caching and have loader available per request only
  const companyLoader = createCompanyLoader();

  // create separate context object
  const context = {};

  // include companyloader function into context to use it in the resolver
  context.companyLoader = companyLoader;

  // if client sends request with valid headers
  // there should be token included in auth header
  // token is decoded using 'authMiddleware' in app.use(...)

  if (req.auth) {
    // decoded token contains sub property, which is a id of user
    const user = await getUser(req.auth.sub);
    context.user = user;
  }
  return context;
}

/** create instance of apollo server */
const apolloServer = new ApolloServer({ typeDefs, resolvers });

/** Run apollo server */
await apolloServer.start();

/** apply expressMiddleware to a specific path
 * contex in options object is used to pass values to resolvers
 * context is a function that has req and res args
 * received from apollo express middlewere
 */
app.use('/graphql', expressMiddleware(apolloServer, { context: getContext }));

app.listen({ port: PORT }, () => {
  console.log(`Server running on port ${PORT}`);
});
