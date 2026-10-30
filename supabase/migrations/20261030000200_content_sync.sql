-- Generated from src/content by npm run content:sql. Do not edit by hand.
insert into private.lesson_catalog (id,module_id,is_free,exam,active) values
('shared-lesson-011','grammar',false,'shared',true),
('shared-lesson-012','grammar',false,'shared',true),
('shared-lesson-013','grammar',false,'shared',true),
('shared-lesson-014','grammar',false,'shared',true),
('shared-lesson-015','reading-strategies',false,'shared',true),
('shared-lesson-016','listening-strategies',false,'shared',true),
('shared-lesson-017','writing-strategies',false,'shared',true),
('shared-lesson-018','writing-strategies',false,'shared',true)
on conflict (id) do update set module_id=excluded.module_id,is_free=excluded.is_free,exam=excluded.exam,active=excluded.active;
