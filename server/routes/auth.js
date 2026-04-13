import express from 'express';
import pool from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authRouter = express.Router();


authRouter.post('/register', async (req, res)=> {
    try {
        const {username, password, confirmPassword, email} = req.body;

        if (password !== confirmPassword) {
            return res.status(400).json({ message: 'Passwords do not match.' });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        await pool.query('INSERT INTO users (username, password, email) VALUES ($1, $2, $3) RETURNING *', [username, hashedPassword, email]);
        res.status(201).json({ message: 'User created successfully.' });

    } catch (error) {
        if (error.code === '23505') {
            return res.status(400).json({ message: 'Username or email already taken.' });
        }
        console.error(error);
        res.status(500).json({ message: 'An error occurred.' });
    }
});

    authRouter.post('/login', async (req, res) => {
        try {
        const {username,password} = req.body;

        const getUser = await pool.query('SELECT * FROM users WHERE username = $1', [username]);

        const hashResult = await bcrypt.compare(password,getUser.rows[0].password);
        if(hashResult){
            const token = jwt.sign({id: getUser.rows[0].user_id, username: username}, process.env.JWT_SECRET_KEY, {expiresIn: '1h'});
            return res.status(200).json({token,user_id: getUser.rows[0].user_id});

        }
        } catch (error){
            console.error(error);
            res.status(400).send('Invalid Credentials: Unauthorized')
        }
    })

export default authRouter;