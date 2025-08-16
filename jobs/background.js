
const db = require('../db')
const {startBBBRecording} = require('./recorder')
const queue = require('../queue')


// running the background task of processing every link in the queue
const processURLQueue = async () =>{
	

	
    if (queue.isEmpty()){
        console.log("Queue is empty, waiting...");
	const queueCheck = await db.query("SELECT id,link FROM user_links WHERE status IN ($1,$2) ORDER BY created_at",['in queue','processing'])
//	console.log(queueCheck,queueCheck.rows.length)
	if (queueCheck.rows.length >0) {
			const rows = queueCheck.rows;
			rows.forEach(row => {
				queue.enqueue(row.id);
			})
		};
	

        setTimeout(processURLQueue,5000);
        return;
    } 
    try{

        
    const linkid = queue.peek();
    if (linkid !== null){
        const result = await db.query("SELECT link,video_id FROM user_links WHERE id=$1", [linkid])
        if (result.rows.length == 0){
            console.log("link does not exist")
        }
        else{
            const link = result.rows[0].link;
            const videoId = result.rows[0].video_id
            console.log('proccessing the link...');
            await db.query("UPDATE user_links SET status = $1 WHERE id = $2",["processing",linkid]);
            await startBBBRecording(link,linkid,videoId);
              
            console.log("link is processed now")
            queue.dequeue()
		console.log(queue);
            }
        }
    }catch(error){
        console.error('Error processing the link:',error);
        
    }
    setTimeout(processURLQueue,0);

};

module.exports = {processURLQueue};
