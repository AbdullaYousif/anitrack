import express from 'express';
import pool from './db.js';
import router from './routes/watchlist.js';
import authRouter from './routes/auth.js';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many attempts, please try again later.' },
});

app.use('/watchlist', router);
app.use('/auth', authLimiter, authRouter);

app.get('/', async (req, res)=> {
   const response = await pool.query('SELECT NOW()');
   res.send(response.rows);

})


app.listen(port, () => {
    console.log(`Express Server listening on port ${port}`);
    console.log(`FRONTEND_URL: ${process.env.FRONTEND_URL}`);
})