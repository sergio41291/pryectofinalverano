const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'learnmind_user',
  password: 'CAMBIAR_POSTGRESQL_PASSWORD_SEGURA',
  database: 'learnmind_production'
});

async function checkSummaries() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const result = await client.query(`
      SELECT id, title, "userId", "createdAt" 
      FROM summaries 
      ORDER BY "createdAt" DESC 
      LIMIT 5
    `);
    
    console.log('\n=== SUMMARIES IN DATABASE ===');
    console.log(`Total found: ${result.rows.length}`);
    console.log('\n');
    
    if (result.rows.length === 0) {
      console.log('❌ No summaries found in database');
    } else {
      result.rows.forEach((row, i) => {
        console.log(`${i + 1}. ${row.title}`);
        console.log(`   ID: ${row.id}`);
        console.log(`   User ID: ${row.userId}`);
        console.log(`   Created: ${row.createdAt}`);
        console.log('');
      });
    }
    
    // Also check total count
    const countResult = await client.query('SELECT COUNT(*) FROM summaries');
    console.log(`Total summaries in database: ${countResult.rows[0].count}`);
    
    // Check uploads status
    const uploadsResult = await client.query(`
      SELECT id, status, "originalFileName", "createdAt" 
      FROM uploads 
      ORDER BY "createdAt" DESC 
      LIMIT 3
    `);
    
    console.log('\n=== RECENT UPLOADS ===');
    uploadsResult.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.originalFileName}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Status: ${row.status}`);
      console.log(`   Created: ${row.createdAt}`);
      console.log('');
    });
    
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

checkSummaries();
