const axios = require('axios')
require('dotenv').config();

const apiUrl = process.env.API;
const apiKey = process.env.API_KEY;

module.exports = {
  sendVerificationCode: (phone, code) => {
	  const postData = {
			    "sending_type": "pattern",
			    "from_number": "+983000505",
			    "code": process.env.LOGIN_PATTERN_CODE,
			    "recipients": [
				        phone
				      ],
			    "params": {
				        "code": code
				      }
		  }



	axios.post(apiUrl,postData,{
	headers:{
		'Authorization':apiKey,
		'Content-type':'application/json'
	}
	}).then(response => {
		console.log("response:",response);
	}).catch(error => {
		console.error("Error:",error);
	})

//    console.log(`(DUMMY SMS) Verification code for ${phone}: ${code}`);
    return Promise.resolve(true);

  },
  sendfpVerificationCode: (phone, code) => {
	  const postData = {
			    "sending_type": "pattern",
			    "from_number": "+983000505",
			    "code": process.env.FP_PATTERN_CODE,
			    "recipients": [
				        phone
				      ],
			    "params": {
				        "code": code
				      }
		  }



	axios.post(apiUrl,postData,{
	headers:{
		'Authorization':apiKey,
		'Content-type':'application/json'
	}
	}).then(response => {
		console.log("response:",response);
	}).catch(error => {
		console.error("Error:",error);
	})

//    console.log(`(DUMMY SMS) Verification code for ${phone}: ${code}`);
    return Promise.resolve(true);
  },

};
