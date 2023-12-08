alter table "public"."mqtt_connections" add column "receiver" boolean not null default false;
alter table "public"."mqtt_connections" alter column "payload" drop not null;