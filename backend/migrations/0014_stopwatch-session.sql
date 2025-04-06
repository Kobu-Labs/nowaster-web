CREATE TABLE "stopwatch_session" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "category_id" uuid,
    "type" text NOT NULL DEFAULT 'stopwatch',
    "start_time" timestamptz NOT NULL,
    "description" text,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "user_id" character varying NOT NULL,
    CONSTRAINT "stopwatch_session_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


ALTER TABLE ONLY "stopwatch_session" ADD CONSTRAINT "fk_category_table" FOREIGN KEY (category_id) REFERENCES category(id) NOT DEFERRABLE;
ALTER TABLE ONLY "stopwatch_session" ADD CONSTRAINT "fk_session_user" FOREIGN KEY (user_id) REFERENCES "user"(id) NOT DEFERRABLE;

CREATE TABLE "tag_to_stopwatch_session" (
    "id" uuid DEFAULT gen_random_uuid() NOT NULL,
    "created_at" timestamptz NOT NULL DEFAULT now(),
    "tag_id" uuid NOT NULL,
    "session_id" uuid NOT NULL,
    CONSTRAINT "tag_to_stopwatch_session_pkey" PRIMARY KEY ("id")
) WITH (oids = false);


ALTER TABLE ONLY "tag_to_stopwatch_session" ADD CONSTRAINT "fk_session_table" FOREIGN KEY (session_id) REFERENCES stopwatch_session(id) ON DELETE CASCADE NOT DEFERRABLE;
ALTER TABLE ONLY "tag_to_stopwatch_session" ADD CONSTRAINT "fk_tag_table" FOREIGN KEY (tag_id) REFERENCES tag(id) ON DELETE CASCADE NOT DEFERRABLE;

