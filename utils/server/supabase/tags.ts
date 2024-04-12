import { getAdminSupabaseClient } from '../supabase';

const supabase = getAdminSupabaseClient();

export async function getTeacherTags(teacher_profile_id: string) {
  const { data, error } = await supabase.rpc('get_teacher_tag_and_tag_count', {
    teacher_profile_id_param: teacher_profile_id,
  });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}
export async function removeTagsFromTeacherProfile(
  teacher_profile_id: string,
  tag_ids: number[],
): Promise<boolean> {
  // check if the tags belongs to teacher
  const tagsBelongToTeacher = await supabase
    .from('teacher_tags')
    .select('id')
    .in('tag_id', tag_ids)
    .eq('teacher_profile_id', teacher_profile_id);

  if (tagsBelongToTeacher.error) {
    console.log(tagsBelongToTeacher.error);
    return false;
  }

  if (tagsBelongToTeacher.data.length !== tag_ids.length) {
    console.log('Not all tags belong to the teacher');
    return false;
  }

  const { error: deleteError } = await supabase
    .from('tags')
    .delete()
    .in('id', tag_ids);

  if (deleteError) {
    console.error(deleteError);
    return false;
  }

  return true;
}

export async function addTagToTeacherProfile(
  teacher_profile_id: string,
  tag_name: string,
): Promise<boolean> {
  // create tag in tags table
  let { data: tag, error: tagError } = await supabase
    .from('tags')
    .insert({ name: tag_name })
    .select();

  if (tagError) {
    console.error(tagError);
    return false;
  }
  if (!tag || tag.length === 0) {
    console.log('Tag not found after creation');
    return false;
  }

  // associate tag with teacher
  const { error: teacherTagError } = await supabase
    .from('teacher_tags')
    .insert([{ teacher_profile_id: teacher_profile_id, tag_id: tag[0].id }]);

  if (teacherTagError) {
    console.error(teacherTagError);
    return false;
  }

  return true;
}

export async function getOneTimeCodeTags(
  one_time_code_id: string,
): Promise<number[]> {
  const { data: tags, error } = await supabase
    .from('one_time_code_tags')
    .select('tag_id')
    .eq('one_time_code_id', one_time_code_id);

  if (error) {
    console.error(error);
    throw new Error('Failed to get one time code tags');
  }

  return tags.map((tag) => tag.tag_id);
}

export async function setTagsToOneTimeCode(
  one_time_code_id: string,
  tag_ids: number[],
): Promise<boolean> {
  const { data, error } = await supabase.rpc('set_tags_to_one_time_code', {
    one_time_code_id_param: one_time_code_id,
    tag_ids_param: tag_ids,
  });

  if (error) {
    console.error(error);
    return false;
  }

  return true;
}
