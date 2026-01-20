import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { authRoutes } from './src/routes/auth';
import { jobRoutes } from './src/routes/jobs';
import { industryRoutes } from './src/routes/industries';
import { applicationRoutes } from './src/routes/applications';
import { savedJobRoutes } from './src/routes/saved-jobs';
import { userRoutes } from './src/routes/users';
import { emailTemplateRoutes } from './src/routes/email-templates';
import { dashboardRoutes } from './src/routes/dashboard';
import { analyticsRoutes } from './src/routes/analytics';

const app = new Elysia()
  .use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,  // Allow cookies
  }))
  .get('/', () => ({ status: 'ok', message: 'Careers API' }))
  .use(authRoutes)
  .use(jobRoutes)
  .use(industryRoutes)
  .use(applicationRoutes)
  .use(savedJobRoutes)
  .use(userRoutes)
  .use(emailTemplateRoutes)
  .use(dashboardRoutes)
  .use(analyticsRoutes)
  .listen(3001);

console.log('🦊 Elysia running at http://localhost:3001');
