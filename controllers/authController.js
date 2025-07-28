require('dotenv').config()
const bcrypt = require('bcrypt');
const db = require('../db');
const { sendVerificationCode } = require('../utils/smsSender');


const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY; 
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;

function validateEmail(email) {
  // Simple regex for email validation
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

const verificationCodes = new Map();
const loginCodes = new Map();

const authController = {
  sendVerificationCodes: async (req, res) => {
    const { phone } = req.body;
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already exists.' ,type:'phone'});
    }
    if (!phone) return res.status(400).json({ error: 'Phone is required',type:'phone' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(phone, code);

    await sendVerificationCode(phone, code);

    res.json({ success: true });
  },

  verifyCode: (req, res) => {
    const { phone, code } = req.body;
    const savedCode = verificationCodes.get(phone);

    if (!savedCode || savedCode !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' ,type:"code"});
    }

    // Removes the code after use
    verificationCodes.delete(phone);
    res.json({ success: true });
  },

  completeSignup: async (req, res) => {
    const { phone, firstName, lastName, email, password } = req.body;

    if (!phone || !firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'All fields are required',type:"all" });
    }

    if (!validateEmail(email)){
      return res.status(400).json({error:"Email is not valid",type:"email"})
    }
    
    const emailResult = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (emailResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists.',type:'email'});
    }
    if (password.length <8){
      return res.status(400).json({error:" the password must be at least 8 characters",type:'pass'})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await db.query(
        `INSERT INTO users (phone, first_name, last_name, email, password_hash, status)
         VALUES ($1, $2, $3, $4, $5, 'active') RETURNING id`,
        [phone, firstName, lastName, email, hashedPassword]
      );

      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' ,type:'Database'});
    }
  },


  // Login part
  sendLoginCode: async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone is required' ,type:"phone"});
  
    try {
      const userResult = await db.query('SELECT id FROM users WHERE phone=$1', [phone]);
      if (userResult.rowCount === 0) {
        return res.status(400).json({ error: 'Phone not registered',type:"user" });
      }
  
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      loginCodes.set(phone, code);
  
      await sendVerificationCode(phone, code);
  
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' ,type:'Database'});
    }
    
  },

  verifyLoginCode: async (req, res) => {
  const { phone, code } = req.body;
  const savedCode = loginCodes.get(phone);
  
  if (!savedCode || savedCode !== code) {
    return res.status(400).json({ error: 'Invalid or expired code' ,type:'code'});
  }
  
  try {
    const userResult = await db.query('SELECT id, first_name, last_name FROM users WHERE phone=$1', [phone]);
    if (userResult.rowCount === 0) {
      return res.status(400).json({ error: 'User not found' ,type:"user"});
    }
  
    loginCodes.delete(phone);
  
    const user = userResult.rows[0];
    const token = jwt.sign({ id: user.id, name: `${user.first_name} ${user.last_name}` }, SECRET, { expiresIn: TOKEN_EXPIRATION });
  
    // Send token in HttpOnly cookie
    res.cookie('token', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
    res.json({ success: true, name: user.first_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error',type:"Database" });
  }
  },

  loginWithEmail: async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' ,type:'all'});
    
    if (!validateEmail(email)){
      return res.status(400).json({error:"Email is not valid",type:"email"})
    }
    
    const emailResult = await db.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (emailResult.rows.length > 0) {
      return res.status(400).json({ error: 'Email already exists.',type:'email'});
    }
    
    try {
      const userResult = await db.query('SELECT id, first_name, password_hash FROM users WHERE email=$1', [email]);
      if (userResult.rowCount === 0) {
        return res.status(400).json({ error: 'Invalid credentials' ,type:"user"});
      }
  
      const user = userResult.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(400).json({ error: 'Invalid credentials',type:"user" });
      }
  
      const token = jwt.sign({ id: user.id, name: user.first_name }, SECRET, { expiresIn: TOKEN_EXPIRATION });
      res.cookie('token', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
      res.json({ success: true, name: user.first_name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' ,type:"Database"});
    }
  }
};


module.exports = authController;
