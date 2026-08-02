CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username      citext NOT NULL UNIQUE,
  email         citext NOT NULL UNIQUE,
  password_hash text   NOT NULL,
  display_name  text   NOT NULL,
  bio           text   NOT NULL DEFAULT '',
  avatar_url    text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  last_seen_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT users_username_format CHECK (username ~ '^[a-zA-Z0-9_]{3,20}$'),
  CONSTRAINT users_display_name_len CHECK (char_length(display_name) BETWEEN 1 AND 40),
  CONSTRAINT users_bio_len CHECK (char_length(bio) <= 300)
);

CREATE TABLE IF NOT EXISTS conversations (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_group   boolean NOT NULL DEFAULT false,
  name       text,
  dm_key     text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_group_shape CHECK (
    (is_group AND name IS NOT NULL AND dm_key IS NULL) OR
    (NOT is_group AND dm_key IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_dm_key_uniq
  ON conversations (dm_key) WHERE NOT is_group;

CREATE TABLE IF NOT EXISTS conversation_members (
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  joined_at       timestamptz NOT NULL DEFAULT now(),
  last_read_at    timestamptz NOT NULL DEFAULT 'epoch',
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conversation_members_user_idx
  ON conversation_members (user_id);

CREATE TABLE IF NOT EXISTS messages (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id       uuid REFERENCES users(id) ON DELETE SET NULL,
  body            text NOT NULL DEFAULT '',
  image_url       text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT messages_not_empty CHECK (body <> '' OR image_url IS NOT NULL),
  CONSTRAINT messages_body_len CHECK (char_length(body) <= 4000)
);

CREATE INDEX IF NOT EXISTS messages_conversation_idx
  ON messages (conversation_id, created_at DESC);

DO $$ BEGIN
  CREATE TYPE friendship_status AS ENUM ('pending', 'accepted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS friendships (
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       friendship_status NOT NULL DEFAULT 'pending',
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (requester_id, addressee_id),
  CONSTRAINT friendships_no_self CHECK (requester_id <> addressee_id)
);

CREATE INDEX IF NOT EXISTS friendships_addressee_idx
  ON friendships (addressee_id);
