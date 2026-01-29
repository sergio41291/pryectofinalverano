// load-test-processor.js
// Artillery processor para LearnMind AI Load Testing

module.exports = {
  // Setup: Se ejecuta una vez al inicio
  setup: function(context, ee, next) {
    console.log('🚀 Load Test Setup - LearnMind AI Phase 1');
    
    // Crear pool de usuarios de prueba
    context.vars.userPool = [
      { email: 'loadtest@learmmind.ai', password: 'LoadTest123!Secure' },
    ];
    
    context.vars.currentUserIndex = 0;
    
    return next();
  },

  // Cleanup: Se ejecuta una vez al final
  cleanup: function(context, ee, next) {
    console.log('✅ Load Test Complete');
    return next();
  },

  // Antes de cada request
  beforeRequest: function(requestParams, context, ee, next) {
    // Log requests críticos
    if (requestParams.name && 
        (requestParams.name.includes('register') || 
         requestParams.name.includes('login') ||
         requestParams.name.includes('process'))) {
      console.log(`📤 ${requestParams.name}`);
    }
    
    return next();
  },

  // Después de cada response
  afterResponse: function(requestParams, response, context, ee, next) {
    const statusCode = response.statusCode;
    const responseTime = response.responseTime;
    
    // Detectar errores
    if (statusCode >= 400) {
      console.error(`❌ ${requestParams.name} - Status: ${statusCode}`);
      
      // Log del body para debugging
      if (response.body) {
        try {
          const body = JSON.parse(response.body);
          console.error(`   Error: ${body.message || body.error || 'Unknown error'}`);
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
    
    // Alertas de rendimiento
    if (responseTime > 5000) {
      console.warn(`⚠️  Slow response: ${requestParams.name} - ${responseTime}ms`);
    }
    
    // Métrica: contar requests por tipo
    if (!context.vars.requestStats) {
      context.vars.requestStats = {};
    }
    const endpoint = (requestParams.url || '').split('?')[0];
    context.vars.requestStats[endpoint] = (context.vars.requestStats[endpoint] || 0) + 1;
    
    return next();
  },

  // Hook para WebSocket
  wsConnect: function(context, ee, next) {
    console.log('🔌 WebSocket Connected');
    
    ee.on('ws.sent', function(message) {
      console.log('📤 WS Message sent');
    });
    
    ee.on('ws.received', function(message) {
      console.log('📥 WS Message received');
    });
    
    return next();
  },

  // Hook para generar datos dinámicos
  generateTestData: function(context, ee, next) {
    // Generar email único
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    context.vars.dynamicEmail = `test${timestamp}${random}@learmmind.ai`;
    
    return next();
  },
};
