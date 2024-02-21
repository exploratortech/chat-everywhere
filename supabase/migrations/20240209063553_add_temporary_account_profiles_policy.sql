create policy "Enable read access for all users"
on "public"."temporary_account_profiles"
as permissive
for select
to public
using (true);



