import type { PageServerLoad, Actions } from './$types';

export interface OBSConfigs {
  id: number
  name: string
  ip: string
  port: number
  password?: string
}

export const load = (async ({ locals }) => {
  const loadDataPromise = new Promise<OBSConfigs[]>((resolve, reject) => {
    const query = "SELECT * FROM obs";
    locals.db?.all(query, (err: Error|null, rows: OBSConfigs[]) => {
      if(err) {
        reject(err);
        return;
      }
      resolve(rows)
    })
  }) 

  const rows = await loadDataPromise;
  return {
    obsConfigs: rows
  };
}) satisfies PageServerLoad;

export const actions = {
	default: async ({ request, locals }) => {
    const data = await request.formData()
    if (!data.has('name') || !data.has('ip') || !data.has('port')) {
      return
    }

    const sql = 'INSERT INTO obs(name, ip, port, password) VALUES (?, ?, ?, ?)'
    locals.db?.run(sql, [data.get('name'), data.get('ip'), data.get('port'), data.get('password') ?? undefined], function (err) {
      if (err) {
        console.error(err)
      }
    })
	},
} satisfies Actions;