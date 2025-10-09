BEGIN;

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."event_type" AS ENUM (
    'proceed',
    'close'
);


ALTER TYPE "public"."event_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."forbid_username_change"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  if (old.username is not null) and (new.username is distinct from old.username) then
    raise exception 'username is permanent and cannot be changed';
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."forbid_username_change"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lb_noassist_streak"("p_since" timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone) RETURNS TABLE("identity" "uuid", "value" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  select
    e.profile_id as identity,
    date_part(
      'day',
      now() - coalesce(
        max(at) filter (
          where domain = any (
            array[
              'chatgpt.com',
              'chat.openai.com',
              'claude.ai',
              'gemini.google.com',
              'perplexity.ai',
              'copilot.microsoft.com',
              'poe.com',
              'character.ai',
              'huggingface.co',
              'openrouter.ai'
            ]  -- AI domains
          )
        ),
        p_since
      )
    )::bigint as value
  from public.events e
  where at >= p_since
  group by e.profile_id
  order by value desc
  limit 100;
$$;


ALTER FUNCTION "public"."lb_noassist_streak"("p_since" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lb_offgrid_streak"("p_since" timestamp with time zone DEFAULT '1970-01-01 00:00:00+00'::timestamp with time zone) RETURNS TABLE("identity" "uuid", "value" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT profile_id AS identity,
         DATE_PART(
           'day',
           NOW() - COALESCE(MAX(at) FILTER (WHERE event = 'proceed'), p_since)
         )::bigint AS value
  FROM public.events
  WHERE at >= p_since
  GROUP BY profile_id
  ORDER BY value DESC
  LIMIT 100;
$$;


ALTER FUNCTION "public"."lb_offgrid_streak"("p_since" timestamp with time zone) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."lb_saves"("p_since" timestamp with time zone) RETURNS TABLE("identity" "uuid", "value" bigint)
    LANGUAGE "sql" STABLE
    AS $$
  SELECT profile_id AS identity,
         COUNT(*)::bigint AS value
  FROM public.events
  WHERE event = 'close' AND at >= p_since
  GROUP BY profile_id
  ORDER BY value DESC
  LIMIT 100;
$$;


ALTER FUNCTION "public"."lb_saves"("p_since" timestamp with time zone) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."devices" (
    "id" "text" NOT NULL,
    "first_seen" timestamp with time zone DEFAULT "now"() NOT NULL,
    "last_seen" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."devices" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" bigint NOT NULL,
    "at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "profile_id" "uuid",
    "device_id" "text",
    "domain" "text",
    "url" "text",
    "reason" "text",
    "unlock_delay_ms" integer,
    "event" "public"."event_type" NOT NULL
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."events_id_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."events_id_seq" OWNED BY "public"."events"."id";



CREATE TABLE IF NOT EXISTS "public"."friends" (
    "owner" "uuid" NOT NULL,
    "friend" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "friends_no_self" CHECK (("owner" <> "friend"))
);


ALTER TABLE "public"."friends" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."friend_ids" AS
 SELECT "friends"."owner" AS "me",
    "friends"."friend" AS "other"
   FROM "public"."friends"
UNION
 SELECT "friends"."friend" AS "me",
    "friends"."owner" AS "other"
   FROM "public"."friends";


ALTER VIEW "public"."friend_ids" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "username" "text"
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."devices"
    ADD CONSTRAINT "devices_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_pkey" PRIMARY KEY ("owner", "friend");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_username_key" UNIQUE ("username");



CREATE INDEX "events_identity_idx" ON "public"."events" USING "btree" (COALESCE(("profile_id")::"text", "device_id"), "at" DESC);



CREATE OR REPLACE TRIGGER "trg_forbid_username_change" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW WHEN (("old"."username" IS DISTINCT FROM "new"."username")) EXECUTE FUNCTION "public"."forbid_username_change"();



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "public"."devices"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_friend_fkey" FOREIGN KEY ("friend") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."friends"
    ADD CONSTRAINT "friends_owner_fkey" FOREIGN KEY ("owner") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "allow read all devices" ON "public"."devices" FOR SELECT USING (true);



CREATE POLICY "allow read all profiles" ON "public"."profiles" FOR SELECT USING (true);



ALTER TABLE "public"."devices" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "devices_select_all" ON "public"."devices" FOR SELECT USING (true);



ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "events_select_all" ON "public"."events" FOR SELECT USING (true);



ALTER TABLE "public"."friends" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "friends_rw_own" ON "public"."friends" TO "authenticated" USING (("owner" = "auth"."uid"())) WITH CHECK (("owner" = "auth"."uid"()));



ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT TO "authenticated" WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "profiles_select_all" ON "public"."profiles" FOR SELECT USING (true);



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



CREATE POLICY "read own identity" ON "public"."events" FOR SELECT USING (true);





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."forbid_username_change"() TO "anon";
GRANT ALL ON FUNCTION "public"."forbid_username_change"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."forbid_username_change"() TO "service_role";



GRANT ALL ON FUNCTION "public"."lb_noassist_streak"("p_since" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lb_noassist_streak"("p_since" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lb_noassist_streak"("p_since" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."lb_offgrid_streak"("p_since" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lb_offgrid_streak"("p_since" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lb_offgrid_streak"("p_since" timestamp with time zone) TO "service_role";



GRANT ALL ON FUNCTION "public"."lb_saves"("p_since" timestamp with time zone) TO "anon";
GRANT ALL ON FUNCTION "public"."lb_saves"("p_since" timestamp with time zone) TO "authenticated";
GRANT ALL ON FUNCTION "public"."lb_saves"("p_since" timestamp with time zone) TO "service_role";


















GRANT ALL ON TABLE "public"."devices" TO "anon";
GRANT ALL ON TABLE "public"."devices" TO "authenticated";
GRANT ALL ON TABLE "public"."devices" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."friends" TO "anon";
GRANT ALL ON TABLE "public"."friends" TO "authenticated";
GRANT ALL ON TABLE "public"."friends" TO "service_role";



GRANT ALL ON TABLE "public"."friend_ids" TO "anon";
GRANT ALL ON TABLE "public"."friend_ids" TO "authenticated";
GRANT ALL ON TABLE "public"."friend_ids" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;

COMMIT;