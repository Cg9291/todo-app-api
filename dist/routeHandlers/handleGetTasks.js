import { db } from '../database/db.js';
export async function handleGetTasks(userId, page, limit) {
    let selectQuery;
    let params = [];
    if (limit === 0 || page === 0) {
        throw new Error("0 is an invalid parameter");
    }
    if (!limit) {
        selectQuery = `SELECT * FROM tasks WHERE user_id = ($1) ORDER BY id `;
        params = [userId];
    }
    else {
        if (!page) {
            selectQuery = `SELECT * FROM tasks WHERE user_id = ($1) ORDER BY id LIMIT ($2)`;
            params = [userId, limit];
        }
        else {
            selectQuery = `SELECT * FROM tasks WHERE user_id = ($1) ORDER BY id LIMIT ($2) OFFSET ($3)`;
            params = [userId, limit, (page - 1) * limit];
        }
    }
    try {
        const result = await db.query(selectQuery, params);
        const total = await db.query(`SELECT COUNT(*) AS total FROM tasks WHERE user_id = ($1)`, [userId]);
        const totalRows = total.rows[0].total;
        return { data: result.rows, total: totalRows };
    }
    catch (err) {
        console.error(`error ${err} `);
        throw err;
    }
}
