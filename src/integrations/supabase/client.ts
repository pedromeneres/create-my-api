// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://eanvjigeconbgzdeahgw.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhbnZqaWdlY29uYmd6ZGVhaGd3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3OTIzMTMsImV4cCI6MjA1MjM2ODMxM30.QwQ3zbzsU-NC89J3Qysf0kFhuGbUMQkCwHdr5GXIl7E";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);