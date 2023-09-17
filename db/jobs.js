import { connection } from './connection.js';
import { generateId } from './ids.js';

const getJobTable = () => connection.table('job');

export async function CountJobs() {
  const { count } = await getJobTable().first().count('* as count');
  return count;
}

export async function getJobs(limit, offset) {
  const query = getJobTable().select().orderBy('createdAt', 'desc');

  // limit in SQL is max number of items to be displayed
  if (limit) {
    query.limit(limit);
  }

  // offset in SQL is a number of items skipped
  if (offset) {
    query.offset(offset);
  }
  return await query;
}

export async function getJobsByCOmpany(companyId) {
  return await getJobTable().select().where({ companyId });
}

export async function getJob(id) {
  return await getJobTable().first().where({ id });
}

export async function createJob({ companyId, title, description }) {
  const job = {
    id: generateId(),
    companyId,
    title,
    description,
    createdAt: new Date().toISOString(),
  };
  await getJobTable().insert(job);
  return job;
}

export async function deleteJob(id, companyId) {
  const job = await getJobTable().first().where({ id });
  if (!job) {
    throw new Error(`Job not found: ${id}`);
  }
  if (job.companyId !== companyId) {
    throw new Error('You are not authorized to delete this job');
  }
  await getJobTable().delete().where({ id });
  return job;
}

export async function updateJob({ id, title, description, companyId }) {
  const job = await getJobTable().first().where({ id });
  if (!job) {
    throw new Error(`Job not found: ${id}`);
  }
  if (job.companyId !== companyId) {
    throw new Error('You are not authorized to update this job');
  }
  const updatedFields = { title, description };
  await getJobTable().update(updatedFields).where({ id });
  return { ...job, ...updatedFields };
}
