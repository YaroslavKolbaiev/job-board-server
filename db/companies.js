import { connection } from './connection.js';
import DataLoader from 'dataloader';

const getCompanyTable = () => connection.table('company');

export async function getCompany(id) {
  return await getCompanyTable().first().where({ id });
}

// company loader rcvs array of ids
export function createCompanyLoader() {
  return new DataLoader(async (ids) => {
    // find all companies with id from ids array
    const companies = await getCompanyTable().select().whereIn('id', ids);

    let map = {};
    for (let i = 0; i < companies.length; i++) {
      if (!map[companies[i].id]) {
        const item = companies[i].id;
        map[item] = companies[i];
      }
    }

    console.log('[MAP]', map);

    const result = [];

    for (let j = 0; j < ids.length; j++) {
      if (map[ids[j]]) {
        const item = map[ids[j]];
        result.push(item);
      }
    }

    // dataloader expects to return items in the same order as ids

    // Big O ??? is it good implemetation ? **** MAKE OPTIMIZATION *****
    // return ids.map((id) => companies.find((company) => company.id === id));

    // OPTIMIZED RESULT BigO = O(n)
    return result;
  });
}
