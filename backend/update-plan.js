const { DataSource } = require('typeorm');

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'learpmind',
});

async function updatePlan() {
  try {
    await dataSource.initialize();
    console.log('\n=== ACTUALIZANDO PLAN ===\n');
    
    // Update user plan
    await dataSource.query(
      `UPDATE users SET plan = 'pro' WHERE email = 'underbolivia@gmail.com'`
    );
    
    // Get user ID
    const [user] = await dataSource.query(
      `SELECT id, email, plan, "firstName", "lastName" FROM users WHERE email = 'underbolivia@gmail.com'`
    );
    
    if (!user) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    console.log('✅ Usuario encontrado:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Nombre: ${user.firstName} ${user.lastName}`);
    console.log(`   Plan: ${user.plan}`);
    
    // Check if subscription exists
    const [existingSub] = await dataSource.query(
      `SELECT * FROM subscriptions WHERE "userId" = $1`,
      [user.id]
    );
    
    if (existingSub) {
      // Update existing subscription
      await dataSource.query(
        `UPDATE subscriptions 
         SET plan = 'pro', 
             status = 'active', 
             "startDate" = NOW(), 
             "endDate" = NOW() + INTERVAL '1 year',
             "updatedAt" = NOW()
         WHERE "userId" = $1`,
        [user.id]
      );
      console.log('\n✅ Suscripción actualizada a PRO');
    } else {
      // Create new subscription
      await dataSource.query(
        `INSERT INTO subscriptions (id, "userId", plan, status, "startDate", "endDate", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, 'pro', 'active', NOW(), NOW() + INTERVAL '1 year', NOW(), NOW())`,
        [user.id]
      );
      console.log('\n✅ Suscripción PRO creada');
    }
    
    console.log('\n=== PARA CAMBIAR A ENTERPRISE ===\n');
    console.log('Método 1 - Consola del navegador (F12):');
    console.log('');
    console.log("  fetch('http://localhost:3001/api/subscriptions/upgrade/enterprise', {");
    console.log("    method: 'POST',");
    console.log("    headers: {");
    console.log("      'Authorization': 'Bearer ' + localStorage.getItem('token'),");
    console.log("      'Content-Type': 'application/json'");
    console.log("    }");
    console.log("  }).then(r => r.json()).then(d => {");
    console.log("    alert('Plan actualizado a: ' + d.subscription.plan);");
    console.log("    location.reload();");
    console.log("  })");
    console.log('');
    console.log('Método 2 - Ejecutar este mismo script cambiando "pro" por "enterprise"');
    console.log('');
    
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

updatePlan();
