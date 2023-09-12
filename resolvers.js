import {
  getJob,
  getJobs,
  getJobsByCOmpany,
  createJob,
  deleteJob,
  updateJob,
  CountJobs,
} from './db/jobs.js';
import { getCompany } from './db/companies.js';
import { GraphQLError } from 'graphql';

const formatDate = (value) => {
  return value.slice(0, 'yyyy-mm-dd'.length);
};

const notFoundError = (message) => {
  return new GraphQLError(message, {
    extensions: { code: 'NOT_FOUND' },
  });
};

const notAuthorized = (message) => {
  return new GraphQLError(message, {
    extensions: { code: 'UNAUTHORIZED' },
  });
};
// const rejectIf = (condition) => {
//   if (condition) {
//     throw new Error('Unauthorized');
//   }
// };

export const resolvers = {
  Query: {
    jobs: async (_rootIsAlwaysUndefined, args) => {
      const items = await getJobs(args.limit, args.offset);

      const count = await CountJobs();
      // return object must have same keys as in schema
      return { jobs: items, totalItems: count };
    },
    job: async (_rootIsAlwaysUndefined, args) => {
      const job = await getJob(args.id);

      if (!job) {
        throw notFoundError('Job Not Found');
      }

      return job;
    },
    company: async (_rootIsAlwaysUndefined, args) => {
      const company = await getCompany(args.id);

      if (!company) {
        throw notFoundError('No company found');
      }

      return company;
    },
    // users: (_root) => User.findAll(),
  },

  /** date property does not exist in db table
   * setting the date property in Job object
   * paramenter in fn is a parent object, in this case Job object
   */
  Job: {
    company: (parentIsJob) => getCompany(parentIsJob.companyId),

    // dataLoader used in oder to avoid N+1 query problem
    // when make a query for a list of jobs, qraphql loads all jobs
    // and for each job it make saparate query to fetch company
    company: (parentIsJob, _ifArgsNotProvided, { companyLoader }) => {
      return companyLoader.load(parentIsJob.companyId);
    },
    date: (parentIsJob) => formatDate(parentIsJob.createdAt),
  },

  Company: {
    jobs: (parentIsCompany) => getJobsByCOmpany(parentIsCompany.id),
  },

  Mutation: {
    // context value comes from context object in server file
    createNewJob: (_rootIsAlwaysUndefined, args, context) => {
      if (!context.user) {
        throw notAuthorized('You are not authorized to create a job');
      }
      const { title, description } = args.input;
      return createJob({
        title,
        description,
        companyId: context.user.companyId,
      });
    },

    deleteJob: (_rootIsAlwaysUndefined, args, context) => {
      if (!context.user) {
        throw notAuthorized('You are not authorized to delete a job');
      }
      return deleteJob(args.id, context.user.companyId);
    },

    updateJob: async (_rootIsAlwaysUndefined, args, context) => {
      const { id, title, description } = args.input;

      if (!context.user) {
        throw notAuthorized('You are not authorized to upadate a job');
      }

      return updateJob({
        id,
        title,
        description,
        companyId: context.user.companyId,
      });
    },
  },
  // createJob: (_root, { input }, { user }) => {
  //   rejectIf(!user);
  //   return Job.create({ ...input, companyId: user.companyId });
  // },

  // updateJob: async (_root, { input }, { user }) => {
  //   rejectIf(!user);
  //   const job = await Job.findById(input.id);
  //   rejectIf(user.companyId !== job.companyId);
  //   return Job.update({ ...input, companyId: user.companyId });
  // },

  // deleteJob: async (_root, { id }, { user }) => {
  //   rejectIf(!user);
  //   const job = await Job.findById(id);
  //   rejectIf(user.companyId !== job.companyId);
  //   return Job.delete(id);
  // },
  // createUser: (_root, { input }) => {
  //   return User.create({ ...input });
  // },

  //   User: {
  //     company: (root) => Company.findById(root.companyId),
  //     jobs: (root) => Job.findAll((job) => job.companyId === root.companyId),
  //   },
};
