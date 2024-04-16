import { useSupabaseClient } from '@supabase/auth-helpers-react';

export function useFileUpload() {
  const supabase = useSupabaseClient();
  return async (filename: string, file: File) => {
    const accessToken = (await supabase.auth.getSession()).data.session
      ?.access_token!;
    const result = await fetch(`/api/files/upload-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken,
      },
      body: JSON.stringify({ fileName: filename }),
    });
    const { url, fields } = await result.json();
    const formData = new FormData();
    Object.entries({ ...fields, file }).forEach(([key, value]) => {
      formData.append(key, value as string | Blob);
    });
    const upload = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    return upload.ok;
  };
}
