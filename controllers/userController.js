const db = require('../db');
const fs =require('fs')
const path =require('path');
require('dotenv').config();



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
        `SELECT id, link, created_at ,video_id,status
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

  getDashboardDetail: async (req,res) =>{

    const userId = req.user.id;
    const query =`
    SELECT
      COUNT(*) FILTER (WHERE user_id = $1) as total_requests,
      COUNT(*) FILTER (WHERE user_id = $1 AND status = 'in queue') as queued_requests,
      COUNT(*) FILTER (WHERE user_id = $1 AND  status = 'processing') as processing_requests,
      COUNT(*) FILTER (WHERE user_id = $1 AND status = 'processed') as processed_requests
      FROM user_links
    `
    
    try {

      const result = await db.query(query,[userId])
      const stats = result.rows[0];

      return res.json(stats)

    }catch(err){
      console.log(err)
      res.status(500).json({'error':"database Error",type:"Database"})
    }


  },
  downloadVideo:async (req,res) => {
    const videoId = req.params.id;
    const userId = req.user.id;
    try {

      const videoResult = await db.query(
        "SELECT video_id,user_id FROM user_links WHERE id =$1",[videoId]
    )
    
    
    if (videoResult.rows.length === 0){
      return res.status(404).json({error:"Video not found",id:videoId,type:"video"})
    }
    
    const video = videoResult.rows[0];

    if (video.user_id !== userId){
      return res.status(403).send("forbidden: you do not have access to this video")
    }
    
    const VideoPath = path.join(process.env.VIDEOS_DIR,`${video.video_id}.mp4`)
    
    if(!fs.existsSync(VideoPath)){
      return res.status(404).send({error:"Video is missing",type:"video"})
    }
    
    
    res.download(VideoPath,`Recording-${videoId}.mp4`,(err) => {
      if (err){
        console.log("error sending file:",VideoPath)
        if (!res.headerSent){
          res.status(500).send('Server error while sending')
        }
      }
      
    });

    
    
    
  }catch(err){
    console.log("Error in /videos/download/:id:",err);
    res.status(500).send("Server Error")
  }
  }
};

module.exports = userController;
