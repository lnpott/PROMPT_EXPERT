import { createGenerateHandler } from '../../api/generate.js';

// Exercise the authenticated generation flow without contacting Supabase Auth.
export default createGenerateHandler(async () => ({ userId: 'test-user', token: 'test-token' }));
