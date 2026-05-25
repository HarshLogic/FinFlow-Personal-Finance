const cron = require("node-cron");
const { Stock } = require("../models");
const dotenv = require("dotenv");

dotenv.config();

cron.schedule('35 15 * * *',async ()=>{
    try{
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const stocks = await Stock.find();
        for (const stk of stocks){
            const cmpResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stk.ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
            const cmpData = await cmpResponse.json();
            const latestPrice = Number(cmpData["Global Quote"]?.["05. price"]);

            if(!Number.isNaN(latestPrice) && latestPrice >0){
                stk.cmp = latestPrice;
                await stk.save();
            }
            await sleep(15000); // 15s to respect AlphaVantage 5 requests/minute limit
        }
        console.log("Daily stock updation completed");
    }catch(err){
        console.log("error in deploying : "+err);
    }
},{
    timezone: "Asia/Kolkata"
});