import express from 'express';
import pool from './db.js';
import router from './routes/watchlist.js';
import authRouter from './routes/auth.js';
import cors from 'cors';
const app = express();

app.use(express.json());
const port = 3000;
app.use(cors());
app.use('/watchlist', router);
app.use('/auth', authRouter);

app.get('/', async (req, res)=> {
   const response = await pool.query('SELECT NOW()');
   res.send(response.rows);

})


app.listen(port, () => {
    console.log(`Express Server listening on port ${port}`);
})