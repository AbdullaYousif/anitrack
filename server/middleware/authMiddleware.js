import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const authMiddleware = (req,res, next) => {
    
    const authToken = req.headers['authorization'];

    if(!authToken){
        return res.status(403).json({message: 'No Token Provided'});
    }

    const tokenWithoutBearer = authToken.split(' ')[1];
    jwt.verify(tokenWithoutBearer, process.env.JWT_SECRET_KEY, (err, decoded)=> {
        if(err){
            return res.status(401).json({message: 'Invalid or Expired Token'});
        }
        req.user = decoded;
        next();
    })

}

export default authMiddleware;