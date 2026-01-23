import pg from 'pg';
const { Client } = pg;

async function runKeepAlive() {
  console.log('--- Starting KeepAlive Script (ESM) ---');

  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is missing.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Ensure the log table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_keepalive_log" (
        id SERIAL PRIMARY KEY,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT
      );
    `);

    // 2. Get the last execution time
    const res = await client.query(`
      SELECT executed_at FROM "_keepalive_log" ORDER BY executed_at DESC LIMIT 1;
    `);

    let lastExecutionTime = null;
    let hoursSinceLastRun = 999; // Default high value if no logs exist

    if (res.rows.length > 0) {
      lastExecutionTime = new Date(res.rows[0].executed_at);
      const now = new Date();
      const diffMs = now - lastExecutionTime;
      hoursSinceLastRun = diffMs / (1000 * 60 * 60);
      console.log(`Last execution was ${hoursSinceLastRun.toFixed(2)} hours ago (${lastExecutionTime.toISOString()}).`);
    } else {
      console.log('No previous execution log found.');
    }

    // 3. Logic to decide whether to run
    let shouldRun = false;

    if (hoursSinceLastRun >= 48) {
      console.log('Constraint met: More than 48 hours since last run. FORCING EXECUTION.');
      shouldRun = true;
    } else {
      // Random decision
      const randomValue = Math.random();
      console.log(`Random decision value: ${randomValue}`);
      
      if (randomValue > 0.5) {
        console.log('Random decision: EXECUTE.');
        shouldRun = true;
      } else {
        console.log('Random decision: SKIP.');
        shouldRun = false;
      }
    }

    // 4. Execute or Skip
    if (shouldRun) {
      await client.query(`
        INSERT INTO "_keepalive_log" (status) VALUES ($1);
      `, ['EXECUTED']);
      console.log('KeepAlive query executed successfully.');
    } else {
      console.log('Skipping execution this time.');
    }

  } catch (err) {
    console.error('Error executing KeepAlive script:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('Database connection closed.');
    console.log('--- End KeepAlive Script ---');
  }
}

runKeepAlive();
