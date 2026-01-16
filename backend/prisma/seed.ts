import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123456';

async function main() {
  console.log('🌱 Seeding database...');

  // Create roles
  const adminRole = await prisma.role.upsert({
    where: { name: 'admin' },
    update: {},
    create: {
      name: 'admin',
      description: 'Administrator with full access',
    },
  });

  const staffRole = await prisma.role.upsert({
    where: { name: 'staff' },
    update: {},
    create: {
      name: 'staff',
      description: 'Staff member with limited admin access',
    },
  });

  const userRole = await prisma.role.upsert({
    where: { name: 'user' },
    update: {},
    create: {
      name: 'user',
      description: 'Default user role',
    },
  });

  console.log('✅ Roles created:', { adminRole, staffRole, userRole });

  // Create industries
  const industries = [
    { name: 'Technology', description: 'Software, IT, and tech-related positions' },
    { name: 'Healthcare', description: 'Medical, nursing, and health services' },
    { name: 'Finance', description: 'Banking, accounting, and financial services' },
    { name: 'Education', description: 'Teaching, training, and academic roles' },
    { name: 'Manufacturing', description: 'Production, assembly, and industrial jobs' },
    { name: 'Retail', description: 'Sales, customer service, and store operations' },
    { name: 'Marketing', description: 'Advertising, digital marketing, and brand management' },
    { name: 'Design', description: 'Graphic design, UX/UI, and creative roles' },
    { name: 'Engineering', description: 'Civil, mechanical, electrical engineering' },
    { name: 'Human Resources', description: 'HR management, recruiting, and talent acquisition' },
    { name: 'Sales', description: 'Business development and sales positions' },
    { name: 'Customer Service', description: 'Support, help desk, and customer relations' },
    { name: 'Legal', description: 'Law, compliance, and legal services' },
    { name: 'Consulting', description: 'Business consulting and advisory services' },
    { name: 'Real Estate', description: 'Property management and real estate services' },
    { name: 'Hospitality', description: 'Hotels, restaurants, and tourism' },
    { name: 'Transportation', description: 'Logistics, shipping, and transportation' },
    { name: 'Construction', description: 'Building, architecture, and construction' },
    { name: 'Media & Entertainment', description: 'Broadcasting, journalism, and entertainment' },
    { name: 'Non-Profit', description: 'Charitable organizations and NGOs' },
    { name: 'Government', description: 'Public sector and government positions' },
    { name: 'Other', description: 'Other industries not listed above' },
  ];

  for (const industry of industries) {
    await prisma.industry.upsert({
      where: { name: industry.name },
      update: { description: industry.description },
      create: {
        name: industry.name,
        description: industry.description,
        isActive: true,
      },
    });
  }

  console.log('✅ Industries created:', industries.length);

  // Create default admin user
  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const adminUser = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {},
    create: {
      firstName: 'Admin',
      lastName: 'User',
      email: ADMIN_EMAIL,
      emailVerified: true,
      passwordHash,
      roles: {
        create: {
          roleId: adminRole.id,
          permissions: JSON.stringify({ canDeleteAdmin: false }),
        },
      },
    },
    include: {
      roles: { include: { role: true } },
    },
  });

  console.log('✅ Admin user created:', {
    id: adminUser.id,
    email: adminUser.email,
    roles: adminUser.roles.map((r: { role: { name: string } }) => r.role.name),
  });

  // Get industry IDs for jobs
  const techIndustry = await prisma.industry.findUnique({ where: { name: 'Technology' } });
  const designIndustry = await prisma.industry.findUnique({ where: { name: 'Design' } });
  const marketingIndustry = await prisma.industry.findUnique({ where: { name: 'Marketing' } });
  const financeIndustry = await prisma.industry.findUnique({ where: { name: 'Finance' } });
  const healthcareIndustry = await prisma.industry.findUnique({ where: { name: 'Healthcare' } });
  const engineeringIndustry = await prisma.industry.findUnique({ where: { name: 'Engineering' } });
  const salesIndustry = await prisma.industry.findUnique({ where: { name: 'Sales' } });
  const hrIndustry = await prisma.industry.findUnique({ where: { name: 'Human Resources' } });
  const customerServiceIndustry = await prisma.industry.findUnique({ where: { name: 'Customer Service' } });
  const retailIndustry = await prisma.industry.findUnique({ where: { name: 'Retail' } });
  const educationIndustry = await prisma.industry.findUnique({ where: { name: 'Education' } });
  const hospitalityIndustry = await prisma.industry.findUnique({ where: { name: 'Hospitality' } });
  const constructionIndustry = await prisma.industry.findUnique({ where: { name: 'Construction' } });
  const legalIndustry = await prisma.industry.findUnique({ where: { name: 'Legal' } });

  // Create sample jobs (25 total with PHP currency)
  const jobs = [
    {
      jobNumber: 'JN-0001',
      title: 'Senior Full Stack Developer',
      description: `<h2>About the Role</h2>
<p>We are looking for an experienced <strong>Senior Full Stack Developer</strong> to join our growing engineering team. You will be responsible for building and maintaining scalable web applications.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Design, develop, and maintain full-stack web applications</li>
  <li>Collaborate with product managers and designers to implement new features</li>
  <li>Write clean, maintainable, and well-documented code</li>
  <li>Mentor junior developers and conduct code reviews</li>
  <li>Participate in architectural decisions and technical planning</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>5+ years</strong> of experience in full-stack development</li>
  <li>Proficiency in <strong>React, TypeScript, and Node.js</strong></li>
  <li>Experience with SQL and NoSQL databases</li>
  <li>Strong understanding of RESTful APIs and microservices</li>
</ul>`,
      industryId: techIndustry!.id,
      location: 'Makati City',
      workType: 'HYBRID' as const,
      shiftType: 'FLEXIBLE' as const,
      experienceMin: 5,
      experienceMax: null,
      salaryMin: 80000,
      salaryMax: 150000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0002',
      title: 'UX/UI Designer',
      description: `<h2>Join Our Design Team</h2>
<p>We're seeking a talented <strong>UX/UI Designer</strong> who is passionate about creating beautiful, intuitive user experiences.</p>

<h3>What You'll Do</h3>
<ul>
  <li>Create wireframes, prototypes, and high-fidelity designs</li>
  <li>Conduct user research and usability testing</li>
  <li>Develop and maintain design systems</li>
  <li>Collaborate with developers to ensure pixel-perfect implementation</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>3+ years</strong> of experience in UX/UI design</li>
  <li>Proficiency in <strong>Figma</strong> and prototyping tools</li>
  <li>Strong portfolio demonstrating user-centered design</li>
</ul>`,
      industryId: designIndustry!.id,
      location: 'BGC, Taguig',
      workType: 'REMOTE' as const,
      shiftType: 'FLEXIBLE' as const,
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 50000,
      salaryMax: 90000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0003',
      title: 'Digital Marketing Specialist',
      description: `<h2>Drive Our Growth</h2>
<p>We're looking for a data-driven <strong>Digital Marketing Specialist</strong> to lead our marketing efforts and scale our customer acquisition.</p>

<h3>Key Responsibilities</h3>
<ul>
  <li>Develop and execute comprehensive digital marketing strategies</li>
  <li>Manage paid advertising campaigns (Google Ads, Meta, LinkedIn)</li>
  <li>Optimize conversion rates and customer acquisition costs</li>
  <li>Lead SEO and content marketing initiatives</li>
</ul>

<h3>Qualifications</h3>
<ul>
  <li><strong>2+ years</strong> in digital marketing</li>
  <li>Proven track record of scaling marketing campaigns</li>
  <li>Strong analytical skills with proficiency in Google Analytics</li>
</ul>`,
      industryId: marketingIndustry!.id,
      location: 'Cebu City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 35000,
      salaryMax: 55000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0004',
      title: 'Junior Accountant',
      description: `<h2>Join Our Finance Team</h2>
<p>We are seeking a <strong>Junior Accountant</strong> to support our growing finance department.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Assist in preparing financial statements and reports</li>
  <li>Process accounts payable and receivable</li>
  <li>Maintain accurate financial records</li>
  <li>Support month-end and year-end close processes</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in Accounting or Finance</li>
  <li><strong>1-2 years</strong> of accounting experience</li>
  <li>Proficiency in accounting software</li>
  <li>CPA board passer preferred</li>
</ul>`,
      industryId: financeIndustry!.id,
      location: 'Ortigas Center',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 1,
      experienceMax: 2,
      salaryMin: 25000,
      salaryMax: 35000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0005',
      title: 'Registered Nurse',
      description: `<h2>Make a Difference Every Day</h2>
<p>We are seeking compassionate <strong>Registered Nurses</strong> to join our healthcare team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Provide direct patient care</li>
  <li>Assess, plan, implement, and evaluate patient care plans</li>
  <li>Collaborate with physicians and healthcare team members</li>
  <li>Administer medications and treatments as prescribed</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Active RN license</li>
  <li>BSN degree</li>
  <li>At least <strong>1 year</strong> of clinical experience</li>
  <li>BLS certification required</li>
</ul>`,
      industryId: healthcareIndustry!.id,
      location: 'Quezon City',
      workType: 'ONSITE' as const,
      shiftType: 'ROTATING' as const,
      experienceMin: 1,
      experienceMax: null,
      salaryMin: 25000,
      salaryMax: 40000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0006',
      title: 'Civil Engineer',
      description: `<h2>Build the Future</h2>
<p>We are looking for a skilled <strong>Civil Engineer</strong> to join our construction team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Design and oversee construction projects</li>
  <li>Prepare technical drawings and specifications</li>
  <li>Ensure compliance with building codes and regulations</li>
  <li>Coordinate with contractors and stakeholders</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Licensed Civil Engineer</li>
  <li><strong>3+ years</strong> of experience in construction</li>
  <li>Proficiency in AutoCAD and project management tools</li>
</ul>`,
      industryId: engineeringIndustry!.id,
      location: 'Davao City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 3,
      experienceMax: 8,
      salaryMin: 40000,
      salaryMax: 70000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0007',
      title: 'Sales Executive',
      description: `<h2>Drive Revenue Growth</h2>
<p>We are seeking a dynamic <strong>Sales Executive</strong> to expand our client base.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Generate leads and acquire new clients</li>
  <li>Present and demonstrate products to potential customers</li>
  <li>Negotiate contracts and close deals</li>
  <li>Maintain relationships with existing clients</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>2+ years</strong> of sales experience</li>
  <li>Excellent communication and negotiation skills</li>
  <li>Proven track record of meeting sales targets</li>
</ul>`,
      industryId: salesIndustry!.id,
      location: 'Makati City',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 25000,
      salaryMax: 45000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0008',
      title: 'HR Generalist',
      description: `<h2>Shape Our People Strategy</h2>
<p>We are looking for an <strong>HR Generalist</strong> to support our human resources operations.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Handle recruitment and onboarding processes</li>
  <li>Administer employee benefits and compensation</li>
  <li>Manage employee relations and conflict resolution</li>
  <li>Ensure compliance with labor laws</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in HR or related field</li>
  <li><strong>2+ years</strong> of HR experience</li>
  <li>Knowledge of Philippine labor laws</li>
</ul>`,
      industryId: hrIndustry!.id,
      location: 'Pasig City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 30000,
      salaryMax: 50000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0009',
      title: 'Customer Service Representative',
      description: `<h2>Be the Voice of Our Company</h2>
<p>We are hiring <strong>Customer Service Representatives</strong> to provide excellent support to our customers.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Handle customer inquiries via phone, email, and chat</li>
  <li>Resolve customer complaints and issues</li>
  <li>Process orders and returns</li>
  <li>Document customer interactions</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>High school diploma or equivalent</li>
  <li>Excellent communication skills in English and Filipino</li>
  <li>Previous customer service experience is a plus</li>
</ul>`,
      industryId: customerServiceIndustry!.id,
      location: 'BGC, Taguig',
      workType: 'ONSITE' as const,
      shiftType: 'NIGHT' as const,
      experienceMin: 0,
      experienceMax: 2,
      salaryMin: 18000,
      salaryMax: 25000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0010',
      title: 'Store Manager',
      description: `<h2>Lead Our Retail Operations</h2>
<p>We are seeking an experienced <strong>Store Manager</strong> to oversee our retail store operations.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Manage daily store operations</li>
  <li>Lead and motivate the sales team</li>
  <li>Achieve sales targets and KPIs</li>
  <li>Ensure excellent customer experience</li>
  <li>Manage inventory and visual merchandising</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>3+ years</strong> of retail management experience</li>
  <li>Strong leadership and communication skills</li>
  <li>Results-oriented mindset</li>
</ul>`,
      industryId: retailIndustry!.id,
      location: 'Manila',
      workType: 'ONSITE' as const,
      shiftType: 'ROTATING' as const,
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 35000,
      salaryMax: 55000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0011',
      title: 'React Native Developer',
      description: `<h2>Build Mobile Experiences</h2>
<p>We are looking for a <strong>React Native Developer</strong> to build cross-platform mobile applications.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Develop and maintain React Native applications</li>
  <li>Collaborate with designers and backend developers</li>
  <li>Write clean, testable code</li>
  <li>Optimize app performance</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>2+ years</strong> of React Native experience</li>
  <li>Experience with iOS and Android development</li>
  <li>Knowledge of state management (Redux, MobX)</li>
</ul>`,
      industryId: techIndustry!.id,
      location: 'BGC, Taguig',
      workType: 'REMOTE' as const,
      shiftType: 'FLEXIBLE' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 60000,
      salaryMax: 100000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0012',
      title: 'Senior Graphic Designer',
      description: `<h2>Create Visual Impact</h2>
<p>We are seeking a <strong>Senior Graphic Designer</strong> to lead our creative team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Design marketing materials, social media content, and brand assets</li>
  <li>Maintain brand consistency across all channels</li>
  <li>Mentor junior designers</li>
  <li>Collaborate with marketing and product teams</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>5+ years</strong> of graphic design experience</li>
  <li>Proficiency in Adobe Creative Suite</li>
  <li>Strong portfolio showcasing diverse work</li>
</ul>`,
      industryId: designIndustry!.id,
      location: 'Makati City',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: 55000,
      salaryMax: 85000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0013',
      title: 'Content Marketing Manager',
      description: `<h2>Tell Our Story</h2>
<p>We need a <strong>Content Marketing Manager</strong> to develop and execute our content strategy.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Develop content strategy and editorial calendar</li>
  <li>Create engaging blog posts, articles, and whitepapers</li>
  <li>Manage social media content</li>
  <li>Analyze content performance and optimize</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>4+ years</strong> of content marketing experience</li>
  <li>Excellent writing and editing skills</li>
  <li>SEO knowledge and experience</li>
</ul>`,
      industryId: marketingIndustry!.id,
      location: 'Ortigas Center',
      workType: 'REMOTE' as const,
      shiftType: 'FLEXIBLE' as const,
      experienceMin: 4,
      experienceMax: 8,
      salaryMin: 45000,
      salaryMax: 75000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0014',
      title: 'Senior Financial Analyst',
      description: `<h2>Drive Financial Excellence</h2>
<p>We are looking for a <strong>Senior Financial Analyst</strong> to lead financial planning and analysis.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Develop financial models and forecasts</li>
  <li>Prepare executive-level financial reports</li>
  <li>Lead budgeting and planning processes</li>
  <li>Provide strategic financial recommendations</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>5+ years</strong> of financial analysis experience</li>
  <li>CPA or CFA certification preferred</li>
  <li>Advanced Excel and financial modeling skills</li>
</ul>`,
      industryId: financeIndustry!.id,
      location: 'Makati City',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: 70000,
      salaryMax: 120000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0015',
      title: 'Physical Therapist',
      description: `<h2>Help Patients Recover</h2>
<p>We are seeking a licensed <strong>Physical Therapist</strong> to join our rehabilitation team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Assess patient conditions and develop treatment plans</li>
  <li>Administer physical therapy treatments</li>
  <li>Monitor patient progress and adjust treatments</li>
  <li>Educate patients on exercises and recovery</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Licensed Physical Therapist</li>
  <li><strong>2+ years</strong> of clinical experience</li>
  <li>Strong communication and interpersonal skills</li>
</ul>`,
      industryId: healthcareIndustry!.id,
      location: 'Cebu City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: 6,
      salaryMin: 30000,
      salaryMax: 50000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0016',
      title: 'DevOps Engineer',
      description: `<h2>Automate and Scale</h2>
<p>We are looking for a <strong>DevOps Engineer</strong> to improve our infrastructure and deployment processes.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Design and maintain CI/CD pipelines</li>
  <li>Manage cloud infrastructure (AWS/GCP)</li>
  <li>Implement monitoring and alerting systems</li>
  <li>Automate deployment and scaling processes</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>3+ years</strong> of DevOps experience</li>
  <li>Experience with Docker, Kubernetes</li>
  <li>Strong scripting skills (Python, Bash)</li>
</ul>`,
      industryId: techIndustry!.id,
      location: 'Pasig City',
      workType: 'REMOTE' as const,
      shiftType: 'FLEXIBLE' as const,
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 70000,
      salaryMax: 120000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0017',
      title: 'English Teacher',
      description: `<h2>Inspire Young Minds</h2>
<p>We are seeking passionate <strong>English Teachers</strong> to join our academic team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Prepare and deliver engaging English lessons</li>
  <li>Assess student progress and provide feedback</li>
  <li>Develop curriculum and learning materials</li>
  <li>Participate in school activities and events</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in English or Education</li>
  <li>Licensed Professional Teacher (LET) passer</li>
  <li><strong>2+ years</strong> of teaching experience</li>
</ul>`,
      industryId: educationIndustry!.id,
      location: 'Quezon City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: null,
      salaryMin: 22000,
      salaryMax: 35000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0018',
      title: 'Hotel Front Desk Officer',
      description: `<h2>Create Memorable Experiences</h2>
<p>We are looking for a <strong>Front Desk Officer</strong> to be the face of our hotel.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Welcome and check-in/check-out guests</li>
  <li>Handle reservations and inquiries</li>
  <li>Resolve guest complaints and issues</li>
  <li>Coordinate with housekeeping and other departments</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in Hospitality or related field</li>
  <li>Excellent communication skills</li>
  <li>Previous hotel experience is an advantage</li>
</ul>`,
      industryId: hospitalityIndustry!.id,
      location: 'Boracay',
      workType: 'ONSITE' as const,
      shiftType: 'ROTATING' as const,
      experienceMin: 0,
      experienceMax: 3,
      salaryMin: 18000,
      salaryMax: 28000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0019',
      title: 'Project Manager',
      description: `<h2>Lead Complex Projects</h2>
<p>We are seeking an experienced <strong>Project Manager</strong> to oversee construction projects.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Plan and manage project timelines and budgets</li>
  <li>Coordinate with contractors and stakeholders</li>
  <li>Ensure quality and safety standards</li>
  <li>Report progress to senior management</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>5+ years</strong> of project management experience</li>
  <li>PMP certification is an advantage</li>
  <li>Strong leadership and communication skills</li>
</ul>`,
      industryId: constructionIndustry!.id,
      location: 'Metro Manila',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 5,
      experienceMax: 12,
      salaryMin: 60000,
      salaryMax: 100000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0020',
      title: 'Legal Assistant',
      description: `<h2>Support Legal Excellence</h2>
<p>We are looking for a detail-oriented <strong>Legal Assistant</strong> to support our legal team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Prepare legal documents and correspondence</li>
  <li>Conduct legal research</li>
  <li>Manage case files and documentation</li>
  <li>Schedule appointments and court appearances</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in Legal Management or related field</li>
  <li><strong>1+ years</strong> of experience in a law firm</li>
  <li>Strong attention to detail</li>
</ul>`,
      industryId: legalIndustry!.id,
      location: 'Makati City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 1,
      experienceMax: 4,
      salaryMin: 25000,
      salaryMax: 40000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0021',
      title: 'QA Engineer',
      description: `<h2>Ensure Software Quality</h2>
<p>We are seeking a <strong>QA Engineer</strong> to ensure the quality of our software products.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Develop and execute test plans and test cases</li>
  <li>Perform manual and automated testing</li>
  <li>Report and track bugs</li>
  <li>Collaborate with developers to resolve issues</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>2+ years</strong> of QA experience</li>
  <li>Experience with test automation tools (Selenium, Cypress)</li>
  <li>Strong analytical and problem-solving skills</li>
</ul>`,
      industryId: techIndustry!.id,
      location: 'BGC, Taguig',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 40000,
      salaryMax: 70000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0022',
      title: 'Business Development Manager',
      description: `<h2>Expand Our Reach</h2>
<p>We are looking for a <strong>Business Development Manager</strong> to drive growth and partnerships.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Identify and pursue new business opportunities</li>
  <li>Build and maintain strategic partnerships</li>
  <li>Negotiate contracts and close deals</li>
  <li>Develop market entry strategies</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>5+ years</strong> of business development experience</li>
  <li>Proven track record of revenue growth</li>
  <li>Strong networking and relationship-building skills</li>
</ul>`,
      industryId: salesIndustry!.id,
      location: 'Cebu City',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 5,
      experienceMax: 10,
      salaryMin: 55000,
      salaryMax: 90000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0023',
      title: 'Recruitment Specialist',
      description: `<h2>Find Top Talent</h2>
<p>We are seeking a <strong>Recruitment Specialist</strong> to source and hire the best candidates.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Source candidates through various channels</li>
  <li>Screen resumes and conduct initial interviews</li>
  <li>Coordinate with hiring managers</li>
  <li>Manage the full recruitment lifecycle</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>2+ years</strong> of recruitment experience</li>
  <li>Experience with ATS systems</li>
  <li>Excellent communication and interpersonal skills</li>
</ul>`,
      industryId: hrIndustry!.id,
      location: 'Ortigas Center',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 28000,
      salaryMax: 45000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0024',
      title: 'Data Analyst',
      description: `<h2>Turn Data Into Insights</h2>
<p>We are looking for a <strong>Data Analyst</strong> to help us make data-driven decisions.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Collect, clean, and analyze data</li>
  <li>Create dashboards and visualizations</li>
  <li>Identify trends and patterns</li>
  <li>Present findings to stakeholders</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>2+ years</strong> of data analysis experience</li>
  <li>Proficiency in SQL, Python, and Excel</li>
  <li>Experience with BI tools (Tableau, Power BI)</li>
</ul>`,
      industryId: techIndustry!.id,
      location: 'Makati City',
      workType: 'REMOTE' as const,
      shiftType: 'FLEXIBLE' as const,
      experienceMin: 2,
      experienceMax: 5,
      salaryMin: 45000,
      salaryMax: 80000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
    },
    {
      jobNumber: 'JN-0025',
      title: 'Call Center Team Lead',
      description: `<h2>Lead Our Support Team</h2>
<p>We are seeking an experienced <strong>Call Center Team Lead</strong> to supervise our support agents.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Supervise and coach team members</li>
  <li>Monitor call quality and KPIs</li>
  <li>Handle escalated customer issues</li>
  <li>Prepare performance reports</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li><strong>3+ years</strong> of call center experience</li>
  <li><strong>1+ years</strong> in a supervisory role</li>
  <li>Strong leadership and coaching skills</li>
</ul>`,
      industryId: customerServiceIndustry!.id,
      location: 'Pasig City',
      workType: 'ONSITE' as const,
      shiftType: 'NIGHT' as const,
      experienceMin: 3,
      experienceMax: 7,
      salaryMin: 30000,
      salaryMax: 50000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
    },
    // EXPIRED JOBS
    {
      jobNumber: 'JN-0026',
      title: 'Junior Web Developer (EXPIRED)',
      description: `<h2>Start Your Career</h2>
<p>We were looking for a <strong>Junior Web Developer</strong> to join our development team.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Develop and maintain web applications</li>
  <li>Collaborate with senior developers</li>
  <li>Learn and implement best practices</li>
  <li>Participate in code reviews</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in Computer Science or related field</li>
  <li>Basic knowledge of HTML, CSS, JavaScript</li>
  <li>Eager to learn and grow</li>
</ul>`,
      industryId: techIndustry!.id,
      location: 'Quezon City',
      workType: 'HYBRID' as const,
      shiftType: 'DAY' as const,
      experienceMin: 0,
      experienceMax: 1,
      salaryMin: 20000,
      salaryMax: 30000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // Posted 60 days ago
      expiresAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Expired 7 days ago
    },
    {
      jobNumber: 'JN-0027',
      title: 'Marketing Intern (EXPIRED)',
      description: `<h2>Gain Real Experience</h2>
<p>We were offering a <strong>Marketing Internship</strong> for students and fresh graduates.</p>

<h3>What You Would Have Learned</h3>
<ul>
  <li>Social media marketing</li>
  <li>Content creation and copywriting</li>
  <li>Email marketing campaigns</li>
  <li>Marketing analytics</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Currently enrolled or recent graduate in Marketing</li>
  <li>Strong communication skills</li>
  <li>Creative mindset</li>
</ul>`,
      industryId: marketingIndustry!.id,
      location: 'BGC, Taguig',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 0,
      experienceMax: 0,
      salaryMin: 15000,
      salaryMax: 18000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // Posted 45 days ago
      expiresAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // Expired 14 days ago
    },
    {
      jobNumber: 'JN-0028',
      title: 'Administrative Assistant (EXPIRED)',
      description: `<h2>Support Our Operations</h2>
<p>We were seeking an <strong>Administrative Assistant</strong> to provide administrative support.</p>

<h3>Responsibilities</h3>
<ul>
  <li>Manage calendars and schedules</li>
  <li>Handle correspondence and documents</li>
  <li>Coordinate meetings and events</li>
  <li>Maintain office supplies and equipment</li>
</ul>

<h3>Requirements</h3>
<ul>
  <li>Bachelor's degree in any field</li>
  <li><strong>1+ years</strong> of administrative experience</li>
  <li>Proficiency in MS Office</li>
  <li>Excellent organizational skills</li>
</ul>`,
      industryId: hrIndustry!.id,
      location: 'Makati City',
      workType: 'ONSITE' as const,
      shiftType: 'DAY' as const,
      experienceMin: 1,
      experienceMax: 3,
      salaryMin: 18000,
      salaryMax: 25000,
      salaryCurrency: 'PHP' as const,
      salaryPeriod: 'MONTHLY' as const,
      isPublished: true,
      publishedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Posted 30 days ago
      expiresAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // Expired 3 days ago
    },
  ];

  // Seed jobs - skip existing, add new ones
  let createdCount = 0;
  let skippedCount = 0;

  for (const job of jobs) {
    const existingJob = await prisma.job.findUnique({
      where: { jobNumber: job.jobNumber },
    });

    if (existingJob) {
      skippedCount++;
    } else {
      await prisma.job.create({
        data: job,
      });
      createdCount++;
    }
  }

  if (createdCount > 0) {
    console.log(`✅ Jobs created: ${createdCount}`);
  }
  if (skippedCount > 0) {
    console.log(`ℹ️ Jobs skipped (already exist): ${skippedCount}`);
  }

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
