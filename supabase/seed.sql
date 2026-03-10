-- Create test user (bypasses email confirmation)
INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now()
);
