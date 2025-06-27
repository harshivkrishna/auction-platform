import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAuth() {
  try {
    console.log('Testing authentication endpoints...\n');

    // Test registration
    console.log('1. Testing registration...');
    const registerResponse = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        role: 'bidder'
      })
    });

    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);

    if (registerData.success) {
      console.log('✅ Registration successful!');
      
      // Test login
      console.log('\n2. Testing login...');
      const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        })
      });

      const loginData = await loginResponse.json();
      console.log('Login response:', loginData);

      if (loginData.success) {
        console.log('✅ Login successful!');
        
        // Test protected route
        console.log('\n3. Testing protected route...');
        const token = loginData.data.token;
        const meResponse = await fetch(`${BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        const meData = await meResponse.json();
        console.log('Protected route response:', meData);

        if (meData.success) {
          console.log('✅ Protected route access successful!');
        } else {
          console.log('❌ Protected route access failed:', meData.message);
        }
      } else {
        console.log('❌ Login failed:', loginData.message);
      }
    } else {
      console.log('❌ Registration failed:', registerData.message);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

testAuth(); 