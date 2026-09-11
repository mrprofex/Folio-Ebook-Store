import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY;

const isSupabaseConfigured = Boolean(
  SUPABASE_URL &&
  SUPABASE_SECRET_KEY &&
  !SUPABASE_URL.includes('your-project')
);

let supabase: ReturnType<typeof createClient> | null = null;

if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false }
  });
}

const EBOOKS_BUCKET = 'ebooks';

function generateStoragePath(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const ext = filename.toLowerCase().endsWith('.pdf') ? '.pdf' : '.pdf';
  const baseName = filename.replace(/\.pdf$/i, '').replace(/[^a-zA-Z0-9-_]/g, '-');
  return `${EBOOKS_BUCKET}/${timestamp}-${random}-${baseName}${ext}`;
}

async function uploadPdfToSupabase(buffer: Buffer, filename: string): Promise<{ path: string; size: number }> {
  if (!supabase) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.');
  }

  const storagePath = generateStoragePath(filename);

  console.log('[UPLOAD] Supabase upload attempt:', {
    bucket: EBOOKS_BUCKET,
    storagePath,
    fileSize: buffer.length,
    contentType: 'application/pdf',
    filename
  });

  const { data, error } = await supabase.storage
    .from(EBOOKS_BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'application/pdf',
      upsert: false
    });

  if (error) {
    console.error('[UPLOAD] Supabase upload failed:', {
      message: error.message,
      statusCode: error.statusCode,
      bucket: EBOOKS_BUCKET,
      storagePath,
      fileSize: buffer.length
    });
    throw new Error(`Supabase upload failed: ${error.message}`);
  }

  console.log('[UPLOAD] Supabase upload success:', {
    bucket: EBOOKS_BUCKET,
    storagePath: data.path,
    fileSize: buffer.length
  });

  return { path: data.path, size: buffer.length };
}

async function deletePdfFromSupabase(storagePath: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase.storage
    .from(EBOOKS_BUCKET)
    .remove([storagePath]);

  if (error) {
    console.error('[SUPABASE] Delete error:', error.message);
  }
}

async function createSignedDownloadUrl(storagePath: string, expiresIn = 3600): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase.storage
    .from(EBOOKS_BUCKET)
    .createSignedUrl(storagePath, expiresIn, {
      download: true
    });

  if (error) {
    throw new Error(`Supabase signed URL creation failed: ${error.message}`);
  }

  return data.signedUrl;
}

async function fetchPdfFromSupabase(signedUrl: string): Promise<Response> {
  const response = await fetch(signedUrl);
  if (!response.ok) {
    throw new Error(`Supabase PDF fetch failed with status ${response.status}`);
  }
  return response;
}

async function createSignedUploadUrl(storagePath: string): Promise<{ path: string; token: string; signedUrl: string }> {
  if (!supabase) {
    throw new Error('Supabase not configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY.');
  }

  const { data, error } = await supabase.storage
    .from(EBOOKS_BUCKET)
    .createSignedUploadUrl(storagePath);

  if (error || !data) {
    throw new Error(`Failed to create signed upload URL: ${error?.message || 'Unknown error'}`);
  }

  return {
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl
  };
}

export {
  supabase,
  isSupabaseConfigured,
  EBOOKS_BUCKET,
  generateStoragePath,
  uploadPdfToSupabase,
  deletePdfFromSupabase,
  createSignedDownloadUrl,
  fetchPdfFromSupabase,
  createSignedUploadUrl
};