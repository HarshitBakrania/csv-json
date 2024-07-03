const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createUsersTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.users (
        id SERIAL4 PRIMARY KEY,
        name VARCHAR NOT NULL,
        age INT4 NOT NULL,
        address JSONB,
        additional_info JSONB
      )
    `);
    console.log('Users table created successfully');
  }catch(error){
    console.error('Error creating users table:', error);
  }finally{
    client.release();
  }
}

createUsersTable();