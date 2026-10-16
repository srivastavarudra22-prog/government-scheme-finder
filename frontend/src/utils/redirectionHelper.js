/**
 * @file redirectionHelper.js
 * @description Frontend Application Redirection Resolver adhering to the 5 Official Redirection Rules.
 * 
 * Rules:
 * 1. Direct application URL exists:
 *    - Redirects directly to verified application_url.
 *    - Action: DIRECT_ONLINE ("Apply on Official Portal")
 * 2. Direct application URL is unavailable:
 *    - Redirects to official MyScheme details page.
 *    - Action: MYSCHEME_DETAILS ("View Official Application Guide")
 *    - Notice: "A verified direct online application link is currently unavailable. Please visit the official scheme information page to view the application procedure."
 * 3. Online application is unavailable (Confirmed Offline):
 *    - Action: OFFLINE_GUIDE ("View Offline Instructions")
 *    - Notice: "Online application is not available for this scheme. Please visit the official scheme information page for eligibility details and offline application instructions."
 * 4. Application method is unknown:
 *    - Do NOT assume offline.
 *    - Action: UNKNOWN_GUIDE ("Check Application Details")
 *    - Notice: "A verified online application link is currently unavailable. Please visit the official scheme information page for more details."
 * 5. No verified official URL exists:
 *    - Action: NO_URL (Button disabled: "Official Link Unavailable")
 *    - Notice: "Verified official online links are currently unavailable for this scheme. Please contact the concerned department directly."
 */

function isValidExternalUrl(url) {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function resolveApplicationRedirection(scheme) {
  if (!scheme || typeof scheme !== 'object') {
    return {
      action_type: 'NO_URL',
      application_method: 'unknown',
      target_url: null,
      secondary_url: null,
      button_text: 'Official Link Unavailable',
      badge_label: 'Unavailable',
      is_online: false,
      is_direct_portal: false,
      notice_message: 'Verified official online links are currently unavailable for this scheme. Please contact the concerned department directly.',
      department_info: null,
    };
  }

  // If backend already resolved it, prefer the backend resolution
  if (scheme.application_redirection && typeof scheme.application_redirection === 'object') {
    return scheme.application_redirection;
  }

  const rawMethod = (scheme.application_method || '').toLowerCase().trim();
  const directAppUrl = isValidExternalUrl(scheme.application_url) ? scheme.application_url.trim() : null;
  const mySchemeUrl = isValidExternalUrl(scheme.source_url) ? scheme.source_url.trim() : null;
  const officialWebsite = isValidExternalUrl(scheme.official_website) ? scheme.official_website.trim() : null;
  const departmentInfo = scheme.ministry || (Array.isArray(scheme.state) ? scheme.state.join(', ') : scheme.state) || 'Administering Government Authority';

  let method = 'unknown';
  if (rawMethod === 'online' || (!rawMethod && scheme.application_process && /^online/i.test(scheme.application_process.trim()))) {
    method = 'online';
  } else if (rawMethod === 'offline' || (!rawMethod && scheme.application_process && /^offline/i.test(scheme.application_process.trim()))) {
    method = 'offline';
  }

  // RULE 1: Direct application URL exists
  if (method === 'online' && directAppUrl) {
    return {
      action_type: 'DIRECT_ONLINE',
      application_method: 'online',
      target_url: directAppUrl,
      secondary_url: mySchemeUrl || officialWebsite,
      button_text: 'Apply on Official Portal',
      badge_label: 'Direct Portal Available',
      is_online: true,
      is_direct_portal: true,
      notice_message: null,
      department_info: departmentInfo,
    };
  }

  // RULE 2: Direct application URL is unavailable (Online method, fallback to MyScheme details)
  if (method === 'online' && mySchemeUrl) {
    return {
      action_type: 'MYSCHEME_DETAILS',
      application_method: 'online',
      target_url: mySchemeUrl,
      secondary_url: officialWebsite,
      button_text: 'View Official Application Guide',
      badge_label: 'Official Application Guide',
      is_online: true,
      is_direct_portal: false,
      notice_message: 'A verified direct online application link is currently unavailable. Please visit the official scheme information page to view the application procedure.',
      department_info: departmentInfo,
    };
  }

  // RULE 3: Online application is unavailable (Confirmed Offline)
  if (method === 'offline' && (mySchemeUrl || directAppUrl || officialWebsite)) {
    return {
      action_type: 'OFFLINE_GUIDE',
      application_method: 'offline',
      target_url: mySchemeUrl || directAppUrl || officialWebsite,
      secondary_url: null,
      button_text: 'View Offline Instructions',
      badge_label: 'Offline Application Only',
      is_online: false,
      is_direct_portal: false,
      notice_message: 'Online application is not available for this scheme. Please visit the official scheme information page for eligibility details and offline application instructions.',
      department_info: departmentInfo,
    };
  }

  // RULE 4: Application method is unknown (Do NOT assume offline)
  if (method === 'unknown' && (mySchemeUrl || directAppUrl || officialWebsite)) {
    return {
      action_type: 'UNKNOWN_GUIDE',
      application_method: 'unknown',
      target_url: mySchemeUrl || directAppUrl || officialWebsite,
      secondary_url: null,
      button_text: 'Check Application Details',
      badge_label: 'Application Method Unspecified',
      is_online: false,
      is_direct_portal: false,
      notice_message: 'A verified online application link is currently unavailable. Please visit the official scheme information page for more details.',
      department_info: departmentInfo,
    };
  }

  // RULE 5: No verified official URL exists (Edge case)
  return {
    action_type: 'NO_URL',
    application_method: method,
    target_url: null,
    secondary_url: null,
    button_text: 'Official Link Unavailable',
    badge_label: 'No Official Link Available',
    is_online: false,
    is_direct_portal: false,
    notice_message: 'Verified official online links are currently unavailable for this scheme. Please contact the concerned department directly.',
    department_info: departmentInfo,
  };
}
