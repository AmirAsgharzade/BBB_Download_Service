require('dotenv').config()
const bcrypt = require('bcrypt');
const db = require('../db');
const { sendVerificationCode } = require('../utils/smsSender');
const svgCaptcha = require('svg-captcha');

const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY; 
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;


const codeExpiration = process.env.CODE_EXPIRE;
const codefpExpiration = process.env.CODE_FP_EXPIRE;
const verificationCodes = new Map();
const verificationfpCodes = new Map();


const authController = {
  captcha:async(req,res) =>{
      const captcha = svgCaptcha.create({
    size: 5,
    noise: 3,
    color: true,
    ignoreChars: '0o1il',
    background: '#cc9966',
  });
  req.session.captcha = captcha.text;
  console.log('Captcha stored in session:', req.session.captcha);
  req.session.captchaCreatedAt = Date.now();

  res.type('svg');
  res.status(200).send(captcha.data);



  },

  sendVerificationCodes: async (req, res) => {
    const { phone } = req.body;
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
      return res.status(400).json({ error: 'Phone number already exists.' ,type:'phone'});
    }
    if (!phone) return res.status(400).json({ error: 'Phone is required',type:'phone' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + codeExpiration;

    verificationCodes.set(phone, {code,expiresAt});

    await sendVerificationCode(phone, code);

    res.json({ success: true,code:code });
  },

  verifyCode: (req, res) => {
    const { phone, code } = req.body;
    const data = verificationCodes.get(phone);

    if (!data || data.code !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' ,type:"code"});
    }

    if (Date.now() > data.expiresAt){
        verificationCodes.delete(phone)
        return res.status(400).json({ error: 'Code expired' ,type:"code"});
    }


    // Removes the code after use
    
    res.json({ success: true });
  },

  completeSignup: async (req, res) => {
    const { phone,code, firstName, lastName, password,captcha } = req.body;
    
    if (!phone || !firstName || !lastName || !password || !code || !captcha) {
      console.log(phone,code,firstName,lastName,password,captcha)
      return res.status(400).json({ error: 'All fields are required',type:"all" });
    }
    
    if (req.session.captcha !== captcha){
      console.log(req.session,captcha,req.session.captcha)
      return res.status(400).json({error:"Enter the captcha please",type:"captcha"})
    }
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
      return res.status(400).json({ error: 'phoneNumber already exists.',type:'phone'});
    }
    if (password.length <8){
      return res.status(400).json({error:" the password must be at least 8 characters",type:'pass'})
    }
    if (code != verificationCodes.get(phone).code){
      return res.status(400).json({error:"the verification code is not valid",type:"all"})
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await db.query(
        `INSERT INTO users (phone, first_name, last_name, password_hash,verification_code, status)
         VALUES ($1, $2, $3, $4,$5, 'active') RETURNING id`,
        [phone, firstName, lastName, hashedPassword,verificationCodes.get(phone).code]
      );

      verificationCodes.delete(phone);
      res.json({ success: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' ,type:'Database'});
    }
  },


  // Login part

  login: async (req, res) => {
    const { phoneNumber, password,captcha } = req.body;
    if (!phoneNumber || !password || !captcha) return res.status(400).json({ error: 'All fields are required' ,type:'all'});
    
    if(req.session.captcha !== captcha){
      console.log(req.session.captcha)
      return res.status(400).json({error:'Captcha is required please enter it',type:'captcha'})
    }
    
    try {
      const userResult = await db.query('SELECT id, first_name, last_name ,password_hash FROM users WHERE phone=$1', [phoneNumber]);
      if (userResult.rowCount === 0) {
        return res.status(400).json({ error: 'Invalid credentials' ,type:"user"});
      }
  
      const user = userResult.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(400).json({ error: 'Invalid credentials',type:"user" });
      }  
      const token = jwt.sign({ id: user.id, name: `${user.first_name} ${user.last_name}` }, SECRET, { expiresIn: TOKEN_EXPIRATION });
      res.cookie('token', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
      res.json({ success: true, name: user.first_name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Database error' ,type:"Database"});
    }
  },

  sendfpVerificationCode: async (req,res) => {
    const { phone } = req.body;
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length === 0) {
      return res.status(400).json({ error: 'Phone number Does not exists.' ,type:'phone'});
    }
    if (!phone) return res.status(400).json({ error: 'Phone is required',type:'phone' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + codefpExpiration;

    verificationfpCodes.set(phone, {code,expiresAt});

    await sendVerificationCode(phone, code);

    return res.status(200).json({success:true,code:code})

  },
  
  verifyfpCode: async (req,res) => {

    const { phone, code } = req.body;
    const data = verificationfpCodes.get(phone);

    if (!data || data.code !== code) {
      return res.status(400).json({ error: 'Invalid or expired code' ,type:"code"});
    }

    if (Date.now() > data.expiresAt){
        verificationfpCodes.delete(phone)
        return res.status(400).json({ error: 'Code expired' ,type:"code"});
    }


    // Removes the code after use
    
    res.json({ success: true });


  },

  resetPassword: async (req,res) => {
    const {phone,code,password,conf_password,captcha} = req.body;

     if (!phone || !code || !password || !conf_password || !captcha) {
      return res.status(400).json({ error: 'All fields are required',type:"all" });
    }
    
    if (req.session.captcha !== captcha){
      return res.status(400).json({error:'Please enter the captcha properly',type:"captcha"})
    }

    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length === 0) {
      return res.status(400).json({ error: 'phoneNumber does not exist exists.',type:'phone'});
    }
    if (password.length <8){
      return res.status(400).json({error:" the password must be at least 8 characters",type:'pass'})
    }
    if (code != verificationfpCodes.get(phone).code){
      console.log(code);
      console.log(verificationfpCodes.get(phone));
      return res.status(400).json({error:"the verification code is not valid",type:"all"})
    }

    if (password != conf_password){
      return res.status(400).json({error:"the passwords should match",type:"pass"})
    }
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const result = await db.query(
        `UPDATE users SET password_hash=$1,verification_code=$2 WHERE phone = $3`,
        [hashedPassword,verificationfpCodes.get(phone).code,phone]
      );

      verificationfpCodes.delete(phone);
      return res.json({ success: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Database error' ,type:'Database'});
    }

  }


};


module.exports = authController;
