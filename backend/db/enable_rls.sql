-- Enable RLS on all tables
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "accounts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_roles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "industries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "job_applications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "saved_jobs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "daily_page_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "email_templates" ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin or staff
-- Note: This assumes auth.uid() returns the user's ID
CREATE OR REPLACE FUNCTION public.is_admin_or_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM "user_roles" ur
    JOIN "roles" r ON ur."roleId" = r.id
    WHERE ur."userId" = auth.uid()::uuid
    AND r.name IN ('admin', 'staff')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- Users: users can read/update themselves; admins/staff can read/update all
-- =============================================================================
CREATE POLICY "Users view own profile" ON "users"
  FOR SELECT USING (auth.uid()::uuid = id);

CREATE POLICY "Users update own profile" ON "users"
  FOR UPDATE USING (auth.uid()::uuid = id);

CREATE POLICY "Admins/Staff view all profiles" ON "users"
  FOR SELECT USING (public.is_admin_or_staff());

CREATE POLICY "Admins/Staff update all profiles" ON "users"
  FOR UPDATE USING (public.is_admin_or_staff());

-- =============================================================================
-- Accounts: users can read/delete their own linked accounts
-- =============================================================================
CREATE POLICY "Users view own accounts" ON "accounts"
  FOR SELECT USING (auth.uid()::uuid = "userId");

CREATE POLICY "Users delete own accounts" ON "accounts"
  FOR DELETE USING (auth.uid()::uuid = "userId");

-- =============================================================================
-- Roles: Public read (needed for role assignment logic sometimes) or Admin only
-- Let's stick to Public Read for simplicity, Admin Write
-- =============================================================================
CREATE POLICY "Public read roles" ON "roles"
  FOR SELECT USING (true);

CREATE POLICY "Admins manage roles" ON "roles"
  FOR ALL USING (public.is_admin_or_staff());

-- =============================================================================
-- UserRoles: Users read own roles, Admins manage all
-- =============================================================================
CREATE POLICY "Users read own roles" ON "user_roles"
  FOR SELECT USING (auth.uid()::uuid = "userId");

CREATE POLICY "Admins manage user roles" ON "user_roles"
  FOR ALL USING (public.is_admin_or_staff());

-- =============================================================================
-- EmailTokens: System use mainly, but let's say Admins can view
-- =============================================================================
CREATE POLICY "Admins view email tokens" ON "email_tokens"
  FOR SELECT USING (public.is_admin_or_staff());

-- =============================================================================
-- Industries: Public read, Admin write
-- =============================================================================
CREATE POLICY "Public read industries" ON "industries"
  FOR SELECT USING (true);

CREATE POLICY "Admins manage industries" ON "industries"
  FOR ALL USING (public.is_admin_or_staff());

-- =============================================================================
-- Jobs: Public read published, Admins read all/write
-- =============================================================================
CREATE POLICY "Public read published jobs" ON "jobs"
  FOR SELECT USING ("isPublished" = true);

CREATE POLICY "Admins manage jobs" ON "jobs"
  FOR ALL USING (public.is_admin_or_staff());

-- =============================================================================
-- JobViews: Public insert (anonymous), Admins read
-- =============================================================================
CREATE POLICY "Public insert job views" ON "job_views"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins view job stats" ON "job_views"
  FOR SELECT USING (public.is_admin_or_staff());

-- =============================================================================
-- JobApplications: 
-- Users read own, create own
-- Admins read all, update status
-- =============================================================================
CREATE POLICY "Users read own applications" ON "job_applications"
  FOR SELECT USING (auth.uid()::uuid = "userId");

CREATE POLICY "Users create applications" ON "job_applications"
  FOR INSERT WITH CHECK (
    -- Allow authenticated users to create applications for themselves
    (auth.uid() IS NOT NULL AND auth.uid()::uuid = "userId")
    OR
    -- Allow guest applications (userId is null)
    ("userId" IS NULL)
  );

CREATE POLICY "Admins manage applications" ON "job_applications"
  FOR ALL USING (public.is_admin_or_staff());

-- =============================================================================
-- SavedJobs: Users manage own
-- =============================================================================
CREATE POLICY "Users manage saved jobs" ON "saved_jobs"
  FOR ALL USING (auth.uid()::uuid = "userId");

-- =============================================================================
-- DailyPageView: Analytics
-- =============================================================================
CREATE POLICY "Public insert analytics" ON "daily_page_views"
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update analytics" ON "daily_page_views"
  FOR UPDATE USING (true); -- CAREFUL: ideally this should be restricted, but for incrementing count public might need access if logic is client side. Better if server-side only.

CREATE POLICY "Admins read analytics" ON "daily_page_views"
  FOR SELECT USING (public.is_admin_or_staff());

-- =============================================================================
-- EmailTemplates: Admin manage
-- =============================================================================
CREATE POLICY "Admins manage email templates" ON "email_templates"
  FOR ALL USING (public.is_admin_or_staff());
