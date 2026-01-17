import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoutes } from './src/routes/auth';
import { jobRoutes } from './src/routes/jobs';
import { industryRoutes } from './src/routes/industries';
import { applicationRoutes } from './src/routes/applications';
import { savedJobRoutes } from './src/routes/saved-jobs';
import { userRoutes } from './src/routes/users';

const app = new Elysia()
  .use(cors({ 
    origin: 'http://localhost:3000',
    credentials: true,  // Allow cookies
  }))
  .get('/', () => ({ status: 'ok', message: 'Careers API' }))
  .use(authRoutes)
  .use(jobRoutes)
  .use(industryRoutes)
  .use(applicationRoutes)
  .use(savedJobRoutes)
  .use(userRoutes)
  .listen(3001);

console.log('🦊 Elysia running at http://localhost:3001');
