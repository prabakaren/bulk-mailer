import { Router } from 'express';
import jwt from 'jsonwebtoken';

const router = Router();

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is missing in environment variables');
    return res.status(500).json({ message: 'Server is not configured properly' });
  }

  if (
    username !== process.env.ADMIN_USERNAME ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    console.log(`Failed login attempt for "${username}"`);
    return res.status(401).json({ message: 'Wrong username or password' });
  }

  const token = jwt.sign({ username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token, username });
});

export default router;
