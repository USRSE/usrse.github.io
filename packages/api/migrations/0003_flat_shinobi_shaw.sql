ALTER TABLE "users" ADD COLUMN "member_id" text;--> statement-breakpoint

DO $$
DECLARE
  alphabet text := '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  rec record;
  new_id text;
  i int;
BEGIN
  FOR rec IN SELECT id FROM users WHERE member_id IS NULL LOOP
    new_id := '';
    FOR i IN 1..8 LOOP
      new_id := new_id || substring(alphabet FROM (floor(random() * 32)::int + 1) FOR 1);
    END LOOP;
    UPDATE users SET member_id = new_id WHERE id = rec.id;
  END LOOP;
END $$;--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "member_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_member_id_unique" UNIQUE("member_id");
