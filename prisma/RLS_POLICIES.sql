-- -- Enable Row Level Security on the User table
-- ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;

-- -- Create a policy that allows users to see/edit only their own data
-- -- We use a custom configuration parameter 'app.current_user_id' which we will set in the transaction
-- CREATE POLICY "Users can access their own data"
-- ON "User"
-- FOR ALL
-- USING (id = current_setting('app.current_user_id', true)::text)
-- WITH CHECK (id = current_setting('app.current_user_id', true)::text);

-- -- NOTE: By default, the owner (and superusers) bypass RLS.
-- -- If you want to enforce RLS even for the owner, use:
-- -- ALTER TABLE "User" FORCE ROW LEVEL SECURITY;
-- -- However, be careful as this might break initial authentication (finding the user by email before you have the ID).
-- -- It is recommended to use the default 'ENABLE' and rely on the application to switch roles or restricted users if strict enforcement is needed.
