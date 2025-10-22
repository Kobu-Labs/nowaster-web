CREATE TYPE recurring_session_interval AS ENUM ('monthly', 'weekly', 'bi-weekly', 'daily');

CREATE TABLE "session_template" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "name" text NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),

    "start_date" timestamptz NOT NULL,
    "end_date" timestamptz NOT NULL ,
    "interval" recurring_session_interval NOT NULL,

    "user_id" varchar NOT NULL,
    CONSTRAINT "session_template_pk" PRIMARY KEY ("id")
) WITH (oids = false);
ALTER TABLE ONLY "session_template" ADD CONSTRAINT "fk_template_user" FOREIGN KEY (user_id) REFERENCES "user"(id) NOT DEFERRABLE;

CREATE TABLE "recurring_session" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "template_id" uuid NOT NULL,

    "start_minute_offset" decimal NOT NULL,
    "end_minute_offset" decimal NOT NULL,

    -- session data
    "category_id" uuid,
    "description" text,
    "user_id" varchar NOT NULL,
    CONSTRAINT "recurring_session_pkey" PRIMARY KEY ("id")
) WITH (oids = false);
ALTER TABLE ONLY "recurring_session" ADD CONSTRAINT "fk_category_table" FOREIGN KEY (category_id) REFERENCES category(id) NOT DEFERRABLE;
ALTER TABLE ONLY "recurring_session" ADD CONSTRAINT "fk_session_user" FOREIGN KEY (user_id) REFERENCES "user"(id) NOT DEFERRABLE;
ALTER TABLE ONLY "recurring_session" ADD CONSTRAINT "fk_template_table" FOREIGN KEY (template_id) REFERENCES session_template(id) NOT DEFERRABLE;


CREATE TABLE "tag_to_recurring_session" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "tag_id" uuid NOT NULL,
    "session_id" uuid NOT NULL,
    CONSTRAINT "tag_to_recurring_session_pkey" PRIMARY KEY ("id")
) WITH (oids = false);

ALTER TABLE ONLY "tag_to_recurring_session" ADD CONSTRAINT "fk_session_table" FOREIGN KEY (session_id) REFERENCES recurring_session(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "tag_to_recurring_session" ADD CONSTRAINT "fk_tag_table" FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE NOT DEFERRABLE;

