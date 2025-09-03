require('dotenv').config()
const bcrypt = require('bcrypt');
const db = require('../db');
const { sendVerificationCode,sendfpVerificationCode } = require('../utils/smsSender');
const svgCaptcha = require('svg-captcha');

const jwt = require('jsonwebtoken');
const SECRET = process.env.SECRET_KEY; 
const TOKEN_EXPIRATION = process.env.TOKEN_EXPIRATION;


const codeExpiration = process.env.CODE_EXPIRE;
const codefpExpiration = process.env.CODE_FP_EXPIRE;
const verificationCodes = new Map();
const verificationfpCodes = new Map();

function validateText(text) {
  // Check if length is 11
  if (text.length !== 11) {
    return false;
  }
  
  // Check if it starts with '09'
  if (!text.startsWith('09')) {
    return false;
  }
  
  // Check if it contains only numbers
  if (!/^\d+$/.test(text)) {
    return false;
  }
  
  return true;
}

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
    const { phone,captcha } = req.body;
	if (!phone) return res.status(400).json({ error: 'شماره تلفن لازم است',type:'phone' });
    const phoneValid = validateText(phone);

	  if(!phoneValid){
		res.status(400).json({error:"تلفن وارد شده نا معتبر میباشد",type:'phone'})
	  }
	
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
      return res.status(400).json({ error: 'شماره تلفن تکراری است' ,type:'phone'});
    }
    
    if (!captcha) return res.status(400).json({error:"کد درون عکس لازم است",type:"captcha"})
    if (req.session.captcha !== captcha){
      console.log(req.session.captcha,captcha)
      return res.status(400).json({error:"کد درون عکس را اشتباه وارد کرده اید",type:"captcha"})
    } 
    

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + codeExpiration;

    verificationCodes.set(phone, {code,expiresAt});

    await sendVerificationCode(phone, code);

    res.json({ success: true});
  },

  verifyCode: (req, res) => {
    const { phone, code } = req.body;
    const data = verificationCodes.get(phone);

    if (!data || data.code !== code) {
      return res.status(400).json({ error: 'کد فرستاده شده اشتباه یا منقضی شده است دوباره تلاش کنید' ,type:"code"});
    }

    if (Date.now() > data.expiresAt){
        verificationCodes.delete(phone)
        return res.status(400).json({ error: 'کد فرستاده شده منقضی شده است' ,type:"code"});
    }


    // Removes the code after use
    
    res.json({ success: true });
  },

  completeSignup: async (req, res) => {
    const { phone,code, firstName, lastName, password,pass_conf } = req.body;
    
    if (!phone || !firstName || !lastName || !password || !pass_conf ||!code ) {
      console.log(phone,code,firstName,lastName,password,captcha)
      return res.status(400).json({ error: 'تمامی زمینه ها لازم هستند',type:"all" });
    }
    
    /*if (req.session.captcha !== captcha){
      console.log(req.session.captcha,captcha)
      return res.status(400).json({error:"کد درون عکس را صحیح وارد نمایید",type:"captcha"})
    }*/
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length > 0) {
      return res.status(400).json({ error: 'شماره تلفن تکراری است',type:'phone'});
    }
/*    if (password.length <8){
      return res.status(400).json({error:"رمز عبور باید حد اقل 8 کارکتر باشد",type:'pass'})
    }*/
    if (password !== pass_conf){return res.status(400).json({error:"رمز های عبور باید با هم دیگر یکسان باشند",type:"pass"})}
    if (code != verificationCodes.get(phone).code){
      return res.status(400).json({error:"کد تایید منقضی شده است",type:"all"})
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
      res.status(500).json({ error: 'مشکل دیتابیس' ,type:'Database'});
    }
  },


  // Login part

  login: async (req, res) => {
    const { phoneNumber, password,captcha } = req.body;
    if (!phoneNumber || !password || !captcha) return res.status(400).json({ error: 'تمامی زمینه ها لازم هستند' ,type:'all'});
    

    const phoneValid = validateText(phoneNumber);
	  if (!phoneValid) { return res.status(400).json({error:"شماره وارد شده نامعتبر میباشد",type:"user"})}
    if(req.session.captcha !== captcha){
      console.log(req.session.captcha)
      return res.status(400).json({error:'کد درون عکس را صحیح وارد نمایید',type:'captcha'})
    }
    
    try {
      const userResult = await db.query('SELECT id, first_name, last_name ,password_hash FROM users WHERE phone=$1', [phoneNumber]);
      if (userResult.rowCount === 0) {
        return res.status(400).json({ error: 'اطلاعات وارد شده صحیح نمیباشد' ,type:"user"});
      }
  
      const user = userResult.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        return res.status(400).json({ error: 'اطلاعات وارد شده صحیح نمیباشد',type:"user" });
      }  
      const token = jwt.sign({ id: user.id, name: `${user.first_name} ${user.last_name}` }, SECRET, { expiresIn: TOKEN_EXPIRATION });
      res.cookie('token', token, { httpOnly: true, maxAge: 15 * 60 * 1000 });
      res.json({ success: true, name: user.first_name });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'مشکل دیتابیس' ,type:"Database"});
    }
  },

  sendfpVerificationCode: async (req,res) => {
    const { phone ,captcha} = req.body;
    if (!phone) return res.status(400).json({ error: 'شماره تلفن لازم میباشد',type:'phone' });

    const phoneValid = validateText(phone);

	  if(!phoneValid){
		res.status(400).json({error:"تلفن وارد شده نا معتبر میباشد",type:'phone'})
	  }
	
    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length === 0) {
      return res.status(400).json({ error: 'شماره تلفن شما ثبت نشده است' ,type:'phone'});
    }
       if (!captcha) return res.status(400).json({error:"کد درون عکس لازم میباشد",type:"captcha"})
    if (req.session.captcha !== captcha){
      console.log(req.session.captcha,captcha)
      return res.status(400).json({error:"کد درون عکس را صحیح وارد نمایید",type:"captcha"})
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + codefpExpiration;

    verificationfpCodes.set(phone, {code,expiresAt});

    await sendfpVerificationCode(phone, code);

    return res.status(200).json({success:true})

  },
  
  verifyfpCode: async (req,res) => {

    const { phone, code } = req.body;
    const data = verificationfpCodes.get(phone);

    if (!data || data.code !== code) {
      return res.status(400).json({ error: 'کد تایید فرستاده شده نادرست یا منقضی می باشد' ,type:"code"});
    }

    if (Date.now() > data.expiresAt){
        verificationfpCodes.delete(phone)
        return res.status(400).json({ error: 'کد تایید فرستاده شده منقضی شده است' ,type:"code"});
    }


    // Removes the code after use
    
    res.json({ success: true });


  },

  resetPassword: async (req,res) => {
    const {phone,code,password,conf_password} = req.body;

     if (!phone || !code || !password || !conf_password) {
      return res.status(400).json({ error: 'تمامی زمینه ها الزامی هستند',type:"all" });
    }
    
    /*if (req.session.captcha !== captcha){
      return res.status(400).json({error:'کد درون عکس را صحیح وارد نمایید',type:"captcha"})
    }*/

    const phoneResult = await db.query('SELECT 1 FROM users WHERE phone = $1', [phone]);
    if (phoneResult.rows.length === 0) {
      return res.status(400).json({ error: 'شماره تلفن وارد شده ثبت نشده است',type:'phone'});
    }
    /*if (password.length <8){
      return res.status(400).json({error:"رمز عبور باید حداقل 8 کارکتر باشد",type:'pass'})
    }*/
    if (code != verificationfpCodes.get(phone).code){
      console.log(code);
      console.log(verificationfpCodes.get(phone));
      return res.status(400).json({error:"کد تایید فرستاده شده منقضی شده است",type:"all"})
    }

    if (password != conf_password){
      return res.status(400).json({error:"رمز عبور و رمز عبور تاییدی همخوانی ندارند دوباره تلاش کنید",type:"pass"})
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
      return res.status(500).json({ error: 'مشکل دیتابیس' ,type:'Database'});
    }

  }


};


module.exports = authController;
