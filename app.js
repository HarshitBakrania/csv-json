const fs = require('fs');
const express = require('express');
const { Pool } = require('pg');
require("dotenv").config();
const PORT = 3000;

const app = express();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

function csvToJson(csv) {
    const arr = csv.toString().split('\n');

    let jsonFile = [];

    let title = arr[0].split(',');

    for (let i = 1; i < arr.length; i++) {
        let obj = {};
        let line = arr[i].split(',');

        for (let j = 0; j < line.length; j++) {
            const keys = title[j].trim().split('.');
            let tempObj = obj;

            for (let k = 0; k < keys.length - 1; k++) {
                if (!tempObj[keys[k]]) {
                    tempObj[keys[k]] = {};
                }
                tempObj = tempObj[keys[k]];
            }
            tempObj[keys[keys.length - 1]] = line[j].trim();
        }
        jsonFile.push(obj);
    }

    return jsonFile;
}

async function printAgeDistribution(){
    const client = await pool.connect();
    try{
        const result = await client.query(`
            SELECT
                CASE
                    WHEN age < 20 THEN '< 20'
                    WHEN age BETWEEN 20 AND 40 THEN '20-40'
                    WHEN age BETWEEN 41 AND 60 THEN '40-60'
                    ELSE '> 60'
                END AS age_group,
                COUNT(*) AS count
            FROM users
            GROUP BY age_group
            ORDER BY age_group`);

            const totalUsers = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

            console.log("Age distribution:");
            console.log("Age group | % Distribution");
            console.log("-------------------------");

            result.rows.forEach(row =>{
                const percentage = ((row.count / totalUsers) * 100).toFixed(2);
                const percentageStr = parseFloat(percentage).toString();
                console.log(`${row.age_group} | ${percentageStr}%`);
            })
    }catch(error){
        console.log(error);
    }finally{
        client.release();
    }
}


app.get("/convert", async (req, res) => {
    const client = await pool.connect();
    try {
        const csvFile = fs.readFileSync(process.env.CSV_FILE, 'utf-8');
        const jsonFile = csvToJson(csvFile);
        res.send(jsonFile);

        await client.query('BEGIN');
        for (const user of jsonFile) {
            const name = `${user.name.firstName} ${user.name.lastName}`;
            const age = parseInt(user.age);
            const address = {
                line1: user.address.line1,
                line2: user.address.line2,
                city: user.address.city,
                state: user.address.state,
            };
            const additionalInfo = { gender: user.gender };

            await client.query(
                `INSERT INTO public.users(name, age, address, additional_info) VALUES($1, $2, $3, $4)`,
                [name, age, address, additionalInfo]
            );
        }
        await client.query('COMMIT');

        await printAgeDistribution(client);

    }catch(error) {
        console.log(error);
        await client.query('ROLLBACK');
    }finally {
        client.release();
    }
})

app.listen(PORT, () => console.log(`Server is running on PORT ${PORT}`));