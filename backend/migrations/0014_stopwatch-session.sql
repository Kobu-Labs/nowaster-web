CREATE TABLE "stopwatch_session" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "category_id" uuid NOT NULL,
    "type" text NOT NULL,
    "start_time" timestamptz,
    "description" text DEFAULT 'stopwatch',
    "created_at" timestamptz DEFAULT now(),
    "user_id" character varying,
    CONSTRAINT "stopwatch_session_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


ALTER TABLE ONLY "stopwatch_session" ADD CONSTRAINT "fk_category_table" FOREIGN KEY (category_id) REFERENCES category(id) NOT DEFERRABLE;
ALTER TABLE ONLY "stopwatch_session" ADD CONSTRAINT "fk_session_user" FOREIGN KEY (user_id) REFERENCES "user"(id) NOT DEFERRABLE;

CREATE TABLE "tag_to_stopwatch_session" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz DEFAULT now(),
    "tag_id" uuid,
    "session_id" uuid,
    CONSTRAINT "tag_to_session_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


ALTER TABLE ONLY "tag_to_stopwatch_session" ADD CONSTRAINT "fk_session_table" FOREIGN KEY (session_id) REFERENCES stopwatch_session(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "tag_to_stopwatch_session" ADD CONSTRAINT "fk_tag_table" FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE NOT DEFERRABLE;

