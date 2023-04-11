import { Company, Job, User } from "./db.js";

const rejectIf = (condition) => {
  if (condition) {
    throw new Error("Unauthorized");
  }
};

export const resolvers = {
  Query: {
    job: (_root, args) => Job.findById(args.id),
    jobs: () => Job.findAll(),
    company: (_root, { id }) => Company.findById(id),
    users: (_root) => User.findAll(),
  },

  Mutation: {
    createJob: (_root, { input }, { user }) => {
      rejectIf(!user);
      return Job.create({ ...input, companyId: user.companyId });
    },

    updateJob: async (_root, { input }, { user }) => {
      rejectIf(!user);
      const job = await Job.findById(input.id);
      rejectIf(user.companyId !== job.companyId);
      return Job.update({ ...input, companyId: user.companyId });
    },

    deleteJob: async (_root, { id }, { user }) => {
      rejectIf(!user);
      const job = await Job.findById(id);
      rejectIf(user.companyId !== job.companyId);
      return Job.delete(id);
    },
    createUser: (_root, { input }) => {
      return User.create({...input})
    },
  },

  Job: {
    company: (
      root // parrent object
    ) => Company.findById(root.companyId),
  },

  Company: {
    jobs: (root) => Job.findAll((job) => job.companyId === root.id),
  },

  User: {
    company: (root) => Company.findById(root.companyId),
    jobs: (root) => Job.findAll((job) => job.companyId === root.companyId),
  },
};
