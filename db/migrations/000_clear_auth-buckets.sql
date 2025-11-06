-- Clear all entries from the auth.users table
DELETE FROM auth.users;

-- Delete all objects in all buckets
DELETE FROM storage.objects;

-- Delete all buckets
DELETE FROM storage.buckets;
