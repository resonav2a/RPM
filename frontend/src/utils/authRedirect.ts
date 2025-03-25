/**
 * Helper utility for handling Supabase authentication redirects
 * This helps when users arrive from magic link emails with auth tokens
 */

import { supabase } from '../services/supabase';

/**
 * Check if the current URL contains Supabase auth parameters
 * and process them to complete authentication
 */
export const handleAuthRedirect = async (): Promise<boolean> => {
  // Check if we have auth parameters in the URL
  const hasAuthParams = window.location.hash.includes('access_token') || 
                        window.location.search.includes('access_token');
  
  if (!hasAuthParams) {
    return false;
  }
  
  try {
    // Process the auth parameters
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Auth redirect error:', error);
      return false;
    }
    
    // Log success if we got a session
    if (data?.session) {
      console.log('Authentication successful via redirect');
      
      // Clear the URL hash to remove the token for security
      // Only update the hash, not the full URL (to maintain routing)
      if (window.history.replaceState) {
        window.history.replaceState(null, document.title, window.location.pathname + window.location.search);
      } else {
        window.location.hash = '';
      }
      
      return true;
    }
  } catch (err) {
    console.error('Error processing auth redirect:', err);
  }
  
  return false;
};

/**
 * Extract Supabase token from URL and handle it manually
 * This is a fallback for when redirects don't work properly
 */
export const extractAndProcessAuthToken = () => {
  try {
    const hash = window.location.hash;
    const query = window.location.search;
    
    // Try to find the access token in either hash or query parameters
    let accessToken = '';
    let refreshToken = '';
    
    if (hash.includes('access_token')) {
      // Parse from hash fragment
      const hashParams = new URLSearchParams(hash.substring(1));
      accessToken = hashParams.get('access_token') || '';
      refreshToken = hashParams.get('refresh_token') || '';
    } else if (query.includes('access_token')) {
      // Parse from query parameters
      const queryParams = new URLSearchParams(query);
      accessToken = queryParams.get('access_token') || '';
      refreshToken = queryParams.get('refresh_token') || '';
    }
    
    if (accessToken) {
      console.log('Manually processing auth token');
      // Set the session
      return supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || '',
      });
    }
  } catch (err) {
    console.error('Error extracting auth token:', err);
    return null;
  }
  
  return null;
};