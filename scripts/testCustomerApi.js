import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = 'https://api-dev.baskit.app/baskit-core/distributor-hub/customer';
const API_KEY = process.env.BASKIT_API_KEY || 'YOUR_API_KEY_HERE';

const payload = {
  companyName: 'ABC Distribution',
  phone: '08123456789',
  email: 'contact@abcdist.com',
  companyWebsite: 'https://abcdist.com',
  notes: 'Premium distributor in Jakarta area',
  detailAddress: 'Jl. Sudirman No. 123, Jakarta Pusat',
  postalCode: '12190',
  primaryContact: {
    name: 'John Doe',
    email: 'john@abcdist.com',
    phone: '08123456789',
    jobTitle: 'Purchasing Manager'
  }
};

async function testCustomerApi() {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    console.log('Status:', response.status);
    console.log('Response:', data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testCustomerApi();
