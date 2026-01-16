import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key for storage operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

const APPLICANT_BUCKET = 'applicants_resume';
const USER_BUCKET = 'user_resumes';

export interface UploadResult {
  url: string;
  path: string;
  fileName: string;
}

// Upload resume to Supabase storage
// For job applications: uploadResume(file, jobNumber, applicantEmail)
// For user profiles: uploadResume(file, 'user', userId)
export async function uploadResume(
  file: File,
  identifier: string,
  secondaryIdentifier: string
): Promise<string> {
  // Validate file type
  if (file.type !== 'application/pdf') {
    throw new Error('Only PDF files are allowed');
  }

  // Max file size: 5MB
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size must be less than 5MB');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  
  // Determine bucket and path based on usage
  let bucket: string;
  let path: string;
  
  if (identifier === 'user') {
    // User profile resume
    bucket = USER_BUCKET;
    path = `${secondaryIdentifier}/${timestamp}_${originalName}`;
  } else {
    // Job application resume
    bucket = APPLICANT_BUCKET;
    const sanitizedEmail = secondaryIdentifier.replace(/[^a-zA-Z0-9]/g, '_');
    path = `${identifier}/${sanitizedEmail}_${timestamp}_${originalName}`;
  }

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      contentType: 'application/pdf',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    throw new Error('Failed to upload resume');
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return urlData.publicUrl;
}

// Delete resume from storage
export async function deleteResume(path: string, bucket: 'applicant' | 'user' = 'applicant'): Promise<void> {
  const bucketName = bucket === 'user' ? USER_BUCKET : APPLICANT_BUCKET;
  
  const { error } = await supabase.storage
    .from(bucketName)
    .remove([path]);

  if (error) {
    console.error('Delete error:', error);
    throw new Error('Failed to delete resume');
  }
}
