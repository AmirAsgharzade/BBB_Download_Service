const { Result } = require('pg');
const db = require('../db');
require('dotenv').config()
const { v4: uuidv4 } = require('uuid');
const path = require('path');


const queue = require('../queue')
const fs = require('fs')
const {testUrl} = require('../jobs/recorder');
const {preview} = require('../jobs/recorder')
const screenshotsFolder = process.env.PREVIEW_FOLDER
const {deleteFolder} = require('../jobs/recorder')

const recorderController ={

    previewVideo:async (req,res)=>{
        const {link} = req.body;
        console.log("before the urltest")
        const isvalid = await testUrl(link)
        if (!isvalid){
            console.log("after the url test")
            return res.status(400).json({result:false,ID:null,error:"the link is invalid please provide a valid one.",type:"link"})
        }else{
            const previewId = uuidv4();

                await deleteFolder(screenshotsFolder)
                await preview(link,previewId)
                
                const files = fs.readdir(path.join(screenshotsFolder,previewId),(err,files) => {
                    if (err) {
                        console.log(err)
                        return res.status(500).send({result:false,error:"couldn't read the files properly", type:"files"})
                    }
                    
                    const imageUrls = files.map(file => `/screenshots/tmp/${previewId}/${file}`);
                    res.json({result:true ,images:imageUrls});    
                    console.log(files)
                })
            }
    },

    recordMeeting: async (req,res) =>{

        try{    
            const userID = req.user.id
            const {link} = req.body;
            const isvalid = await testUrl(link)
            if (!isvalid){
                res.status(400).json({result:false,ID:null,error:"the link is invalid please provide a valid one.",type:"link"})
            }else{
                if (req.user){
                    
                    console.log(req.body)
                    const result = await db.query("INSERT INTO user_links(user_id,link,status) VALUES ($1,$2,$3) RETURNING id",
                [userID,link,"in queue"]);
                
                queue.enqueue(result.rows[0].id);
                
                
                res.status(201).send({result:true,ID:result.rows[0].id})
            }
        }
            
        }catch(error){
            console.error(error)

            res.status(500).send({result:false,ID:null});
        }

    },  
    recordStatus: async (req,res) =>{

        try{
            const userID = req.user.id
            const id = req.body.id
            
            
            const result = await db.query('SELECT status FROM session_urls WHERE id=$1 AND user_id = $2',[id,uesrID])
            
            
            if (result.rows.length === 0){
                res.status(404).send({result:false,status:null})
            }else{
                res.status(200).send({result:true,status:result.rows[0].status})
            }
        }catch(error){
            console.error(error)

            res.status(500).send({result:false,error:"Internal Server Error Regarding RS"});
        }
            
    },

    getRecordedFile: async (req,res) =>{
        
        try{

            const id = req.body.id
            const result = await db.query('SELECT link FROM session_urls WHERE id=$1',[id])
            dummy_url = 'Dummy url for downloading id'
            
            if (result.rows.length === 0){
                res.status(404).send({result:false,url:null})
            }else{
                res.status(200).send({result:true,url:dummy_url})
            }
        }catch(error){
            console.log(error)
            res.status(500).send({error:"Internal Server Error regarding GRF"})
        }

    },

    deleteRecordedFile:async (req,res) =>{
        try{

            const id = req.body.id;
            const result = await db.query('DELETE FROM session_urls WHERE id=$1 RETURNING *',[id])
            
            if (result.rows.length === 0){
                res.status(404).send({result:false,deleted:null})
            }else{
                res.status(200).send({result:true,deleted:result.rows})
            }
        }catch(error){
            console.log(error)
            res.status(500).send({error:"Internal server Error regarding DRF"})
        }
    },

    getProcessStatus: async (req,res) =>{
        try{

            const status = req.body.status
            
            if (status === 0 ){
                results = await db.query('SELECT * FROM session_urls')
            }else{
                results = await db.query('SELECT * FROM session_urls WHERE status=$1',[status])
            }
            
            if (results.rows.length === 0){
                res.status(404).send({result:false,results:'no results found with this stauts'})
            }else{
                res.status(200).send({result:true,results:results.rows})
            }
        }catch(error){
            console.log(error)
            res.status(500).send({error:"Error regarding GPStatus"})
        }
    },


}


module.exports = recorderController