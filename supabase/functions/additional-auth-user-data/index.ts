/// <reference path="./deno.d.ts" />

// CORS headers helper
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400', // 24 hours
};

// Helper function to create error response
const createErrorResponse = (error: string, status: number = 500) => {
  return new Response(
    JSON.stringify({
      success: false,
      error: error,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    }
  );
};

// Helper function to create success response
const createSuccessResponse = (data: any, status: number = 200) => {
  return new Response(
    JSON.stringify({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    }),
    {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: status
    }
  );
};

Deno.serve(async (req: Request) => {
  // Handle preflight requests with error handling
  if (req.method === 'OPTIONS') {
    try {
      return new Response(null, { headers: corsHeaders, status: 200 });
    } catch (error: any) {
      console.error('[CORS] Error handling OPTIONS request:', error);
      return new Response(null, { headers: corsHeaders, status: 200 });
    }
  }

  try {
    // Dynamic import to handle import errors gracefully
    let createClient: any;
    try {
      // @ts-ignore - Dynamic import from URL is supported by Deno runtime
      const supabaseModule = await import('https://esm.sh/@supabase/supabase-js@2');
      createClient = supabaseModule.createClient;
    } catch (importError: any) {
      console.error('[API] Failed to import Supabase client:', importError);
      return createErrorResponse('Failed to initialize Supabase client', 500);
    }

    // Initialize Supabase client with environment variables (เหมือน API เดิม - ใช้ SERVICE_ROLE_KEY)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || Deno.env.get('VITE_SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      console.error('[API] Missing Supabase credentials', {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey
      });
      return createErrorResponse('Supabase configuration missing', 500);
    }

    let supabase: any;
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (clientError: any) {
      console.error('[API] Failed to create Supabase client:', clientError);
      return createErrorResponse('Failed to create Supabase client', 500);
    }

    if (req.method !== 'GET') {
      return createErrorResponse('Method not allowed', 405);
    }

    // Parse query parameters from URL
    let url: URL;
    let userId: string | null;
    try {
      url = new URL(req.url);
      const queryParams = url.searchParams;
      userId = queryParams.get('userId');
    } catch (urlError: any) {
      console.error('[API] Failed to parse URL:', urlError);
      return createErrorResponse('Invalid request URL', 400);
    }

    if (!userId) {
      return createErrorResponse('User ID is required', 400);
    }

    // Validate userId format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      console.error('[API] Invalid userId format:', userId);
      return createErrorResponse('Invalid user ID format', 400);
    }

    // Get user info - include email and department
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, first_name, last_name, role, email, department')
      .eq('auth_user_id', userId)
      .maybeSingle();

    if (userError) {
      console.error('[API] Error fetching user data:', {
        error: userError,
        userId: userId
      });
      return createErrorResponse('Failed to fetch user data', 500);
    }

    if (!userData) {
      // User not found - return success with null data
      return createSuccessResponse({
        user: null,
        salesMember: null
      }, 200);
    }

    // Get sales team info if user is a sales role
    let salesMemberData: any = null;
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales_team_with_user_info')
        .select('id, user_id, status, current_leads')
        .eq('user_id', userData.id)
        .maybeSingle();
      
      if (salesError) {
        // Log error but don't fail the request - sales data is optional
        console.warn('[API] Error fetching sales team data:', salesError);
      } else if (salesData) {
        salesMemberData = {
          ...salesData,
          name: userData.first_name && userData.last_name 
            ? `${userData.first_name} ${userData.last_name}`
            : 'Unknown User',
          role: userData.role
        };
      }
    } catch (salesError: any) {
      // Log error but don't fail the request - sales data is optional
      console.warn('[API] Exception fetching sales team data:', salesError);
    }

    const result = {
      user: userData,
      salesMember: salesMemberData
    };

    return createSuccessResponse(result, 200);

  } catch (error: any) {
    console.error('[API] Unexpected error in user-data API:', {
      error: error,
      message: error?.message,
      stack: error?.stack
    });
    return createErrorResponse(
      error?.message || 'Internal server error',
      500
    );
  }
});
