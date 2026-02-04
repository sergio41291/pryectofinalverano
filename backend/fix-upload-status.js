const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'learnmind_user',
  password: 'CAMBIAR_POSTGRESQL_PASSWORD_SEGURA',
  database: 'learnmind_production'
});

async function fixUploadStatus() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    // Update specific uploads that are stuck in 'processing' status
    const result = await client.query(`
      UPDATE uploads 
      SET status = 'completed'
      WHERE status = 'processing' 
        AND id IN (
          'ec0efe03-b1f7-4175-8e49-c602b193087e',
          '6e8cc81a-5267-4476-83c1-a404daa472f2'
        )
      RETURNING id, "originalFileName", status
    `);
    
    console.log(`\n✅ Updated ${result.rows.length} uploads to 'completed' status:\n`);
    
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.originalFileName} (${row.id})`);
      console.log(`   New Status: ${row.status}\n`);
    });
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

fixUploadStatus();
