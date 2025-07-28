module.exports = {
  sendVerificationCode: (phone, code) => {
    console.log(`(DUMMY SMS) Verification code for ${phone}: ${code}`);
    return Promise.resolve(true);
  }
};
