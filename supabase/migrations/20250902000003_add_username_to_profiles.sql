-- Add username column to profiles
alter table profiles add column username text unique;
