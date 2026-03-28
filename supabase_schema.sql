-- ============================================================
-- Minus — Schéma Supabase
-- À coller dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Table des groupes (un groupe = un ensemble joueurs + parties)
CREATE TABLE IF NOT EXISTS groups (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name         text NOT NULL,
  owner_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invite_code  text UNIQUE NOT NULL,
  data         jsonb DEFAULT '{}' NOT NULL,
  created_at   timestamptz DEFAULT now() NOT NULL,
  updated_at   timestamptz DEFAULT now() NOT NULL
);

-- Table de membership (qui est dans quel groupe)
CREATE TABLE IF NOT EXISTS group_members (
  group_id   uuid REFERENCES groups(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role       text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  joined_at  timestamptz DEFAULT now() NOT NULL,
  PRIMARY KEY (group_id, user_id)
);

-- Mise à jour automatique de updated_at sur groups
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER groups_updated_at
  BEFORE UPDATE ON groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select"  ON groups;
DROP POLICY IF EXISTS "groups_insert"  ON groups;
DROP POLICY IF EXISTS "groups_update"  ON groups;
DROP POLICY IF EXISTS "groups_delete"  ON groups;
DROP POLICY IF EXISTS "members_select" ON group_members;
DROP POLICY IF EXISTS "members_insert" ON group_members;
DROP POLICY IF EXISTS "members_delete" ON group_members;

-- groups : lecture pour le propriétaire OU les membres du groupe
CREATE POLICY "groups_select" ON groups
  FOR SELECT USING (
    owner_id = auth.uid()
    OR
    id IN (
      SELECT group_id FROM group_members WHERE user_id = auth.uid()
    )
  );

-- groups : création pour tout utilisateur authentifié
CREATE POLICY "groups_insert" ON groups
  FOR INSERT WITH CHECK (owner_id = auth.uid());

-- groups : modification uniquement par le propriétaire
CREATE POLICY "groups_update" ON groups
  FOR UPDATE USING (owner_id = auth.uid());

-- groups : suppression uniquement par le propriétaire
CREATE POLICY "groups_delete" ON groups
  FOR DELETE USING (owner_id = auth.uid());

-- group_members : lecture de ses propres memberships
CREATE POLICY "members_select" ON group_members
  FOR SELECT USING (user_id = auth.uid());

-- group_members : ajout par le proprio du groupe ou soi-même (via RPC)
CREATE POLICY "members_insert" ON group_members
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- group_members : suppression par le proprio ou soi-même
CREATE POLICY "members_delete" ON group_members
  FOR DELETE USING (
    user_id = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM groups WHERE id = group_id AND owner_id = auth.uid()
    )
  );

-- ============================================================
-- RPC : rejoindre un groupe via code d'invitation
-- Appelée par : supabase.rpc("join_group_by_code", { invite_code })
-- ============================================================

CREATE OR REPLACE FUNCTION join_group_by_code(invite_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_group_id uuid;
BEGIN
  SELECT id INTO v_group_id
  FROM groups
  WHERE groups.invite_code = upper(trim(join_group_by_code.invite_code));

  IF v_group_id IS NULL THEN
    RAISE EXCEPTION 'Code invalide';
  END IF;

  INSERT INTO group_members (group_id, user_id, role)
  VALUES (v_group_id, auth.uid(), 'member')
  ON CONFLICT (group_id, user_id) DO NOTHING;

  RETURN v_group_id;
END;
$$;

-- ============================================================
-- Realtime : autoriser les updates en temps réel sur groups
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE groups;

-- ============================================================
-- Index utiles
-- ============================================================

CREATE INDEX IF NOT EXISTS groups_owner_idx       ON groups(owner_id);
CREATE INDEX IF NOT EXISTS groups_invite_code_idx ON groups(invite_code);
CREATE INDEX IF NOT EXISTS members_user_idx       ON group_members(user_id);
