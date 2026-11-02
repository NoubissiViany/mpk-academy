-- Derived requirements remain private and come from the authored content.
alter table private.question_bank add column difficulty integer check (difficulty between 1 and 4);
alter table private.question_bank add column minimum_words integer check (minimum_words > 0);
-- Freeze presentation independently of later content/manifest changes.
alter table private.mock_sessions add column presentation jsonb;
update private.mock_sessions s set presentation = jsonb_build_object('manifest', m.manifest, 'optionOrder', '{}', 'version', 1)
from private.content_manifests m where m.id = s.manifest_id;
