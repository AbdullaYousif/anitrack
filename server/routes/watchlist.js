import express from 'express';
import pool from '../db.js';
import authMiddleware from '../middleware/authMiddleware.js';

const watchlistRouter = express.Router();

watchlistRouter.get('/:user_id', authMiddleware, async (req, res)=> {
    const response = await pool.query('SELECT * FROM watchlist WHERE user_id = $1',[req.params.user_id]);
    res.send(response.rows);
})

watchlistRouter.post('/', authMiddleware, async (req,res)=> {
    const response = await pool.query('INSERT INTO watchlist (user_id, mal_id, anime_data, status) VALUES ($1 , $2, $3, $4) RETURNING *' ,[req.body.user_id,req.body.mal_id,req.body.anime_data,req.body.status]);
    res.send(response.rows[0]);
})

watchlistRouter.patch('/:mal_id', authMiddleware, async (req, res)=> {
    const response = await pool.query('UPDATE watchlist SET status =$1 WHERE mal_id = $2 RETURNING *', [req.body.status, req.params.mal_id]);
    res.send(response.rows[0]);
})
watchlistRouter.delete('/:mal_id', authMiddleware, async (req, res)=> {
    await pool.query('DELETE FROM watchlist WHERE mal_id = $1 RETURNING *', [req.params.mal_id]);
    res.send({message: 'Deleted'});
})

export default watchlistRouter;