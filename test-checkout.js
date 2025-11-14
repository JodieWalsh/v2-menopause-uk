// Test script to call create-checkout-public function directly

const SUPABASE_URL = 'https://ppnunnmjvpiwrrrbluno.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwbnVubm1qdnBpd3JycmJsdW5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMTc2MjgsImV4cCI6MjA2OTY5MzYyOH0.FjMYIRk6t2PO-E4GChTzyQG9vXU-N1hK-53AGmSesCE';

async function testCheckout() {
  console.log('=== TESTING CREATE-CHECKOUT-PUBLIC ===');
  console.log('Testing US Market...\n');

  const requestBody = {
    email: 'test-us-market@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'testpass123',
    marketCode: 'US'
  };

  console.log('Request body:', JSON.stringify(requestBody, null, 2));
  console.log('\nCalling function...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-checkout-public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Origin': 'http://localhost:8080'
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    console.log('Response status:', response.status);
    console.log('Response data:', JSON.stringify(data, null, 2));

    if (data.url) {
      console.log('\n=== STRIPE URL GENERATED ===');
      console.log(data.url);
      console.log('\n✅ Copy this URL and paste it in your browser to check if it shows:');
      console.log('   - $25.00 USD (CORRECT for US market)');
      console.log('   - £19.00 GBP (WRONG - still using UK market)');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCheckout();
