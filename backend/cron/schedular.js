const cron = require("node-cron");
const { Stock } = require("../models");
const dotenv = require("dotenv");

dotenv.config();

cron.schedule('35 15 * * *',async ()=>{
    try{
        const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const stocks = await Stock.find();
        const uniqueTickers = [...new Set(stocks.map(s => s.ticker))];
        const priceMap = {};
        for (const ticker of uniqueTickers) {
            const cmpResponse = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${process.env.ALPHA_VANTAGE_API_KEY}`);
            const cmpData = await cmpResponse.json();
            const latestPrice = Number(cmpData["Global Quote"]?.["05. price"]);

            if (!Number.isNaN(latestPrice) && latestPrice > 0) {
                priceMap[ticker] = latestPrice;
            }
            await sleep(1000);
        }
        for (const stk of stocks) {
            if (priceMap[stk.ticker]) {
                stk.cmp = priceMap[stk.ticker];
                await stk.save();
            }
        }
        console.log("Daily stock updation completed");
    }catch(err){
        console.log("error in deploying : "+err);
    }
},{
    timezone: "Asia/Kolkata"
});

// ── Automated Monthly Personal CA Report Generation ─────────────────────────
// Runs at 02:00 AM on the 1st day of every month to finalize the previous month
cron.schedule('0 2 1 * *', async () => {
    try {
        console.log("⏳ Starting automated monthly Personal CA Report generation for all users...");
        const { User, MonthlyFinancialReport } = require("../models");
        const { generateMonthlyReport } = require("../services/monthlyReportService");

        const users = await User.find().select("userId");
        const now = new Date();
        const prevMonth = now.getMonth() === 0 ? 12 : now.getMonth(); // 1-12
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

        let generated = 0;
        let skipped = 0;

        for (const user of users) {
            try {
                // Prevent duplicate generation if already finalized
                const existing = await MonthlyFinancialReport.findOne({
                    userId: user.userId,
                    year: prevYear,
                    month: prevMonth,
                    isProvisional: false,
                });

                if (existing) {
                    skipped++;
                    continue;
                }

                await generateMonthlyReport(user.userId, prevYear, prevMonth, true);
                generated++;
            } catch (userErr) {
                console.warn(`⚠️ Failed automated report for user ${user.userId}:`, userErr.message);
            }
        }

        console.log(`✅ Automated Monthly CA Report run complete: ${generated} generated, ${skipped} skipped.`);
    } catch (err) {
        console.error("❌ Error in automated monthly report cron job:", err.message);
    }
}, {
    timezone: "Asia/Kolkata"
});