const db = require('../db');

const userController = {

  getHistory: async (req, res) => {
    const userId = req.user.id;
    // Support sorting and pagination through query params
    const { page = 1, limit = 10, sortBy = 'created_at', order = 'desc' } = req.query;

    const offset = (page - 1) * limit;
    const validSortColumns = ['id', 'link', 'created_at'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    try {
      const dataResult = await db.query(
        `SELECT id, link, created_at ,download_url,status
         FROM user_links
         WHERE user_id = $1
         ORDER BY ${sortColumn} ${sortOrder}
         LIMIT $2 OFFSET $3`,
        [userId, limit, offset]
      );

      const countResult = await db.query(
        `SELECT COUNT(*) FROM user_links WHERE user_id = $1`,
        [userId]
      );

      res.json({
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].count, 10),
        page: Number(page),
        limit: Number(limit),
        user:req.user.name,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' ,type:"Database"});
    }
  },
};

module.exports = userController;
