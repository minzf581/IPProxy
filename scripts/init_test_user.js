import { IPProxyAPI } from '../src/utils/ipProxyAPI.js';

async function initializeTestUser() {
  const api = new IPProxyAPI();
  
  try {
    // Create test user
    const createUserParams = {
      username: 'test_user',
      email: 'test@example.com',
      // Add any other required parameters based on your API requirements
    };
    
    const response = await api.request('/api/open/app/user/create/v2', createUserParams);
    console.log('User creation response:', response);
    
  } catch (error) {
    console.error('Failed to initialize test user:', error);
  }
}

initializeTestUser();
