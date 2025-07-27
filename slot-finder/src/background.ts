// Background service worker for Chrome extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('World Clock Meet Helper installed');
});

// Handle side panel opening
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Handle OAuth token refresh
chrome.identity.onSignInChanged.addListener((account, signedIn) => {
  if (signedIn) {
    console.log('User signed in:', account);
  } else {
    console.log('User signed out');
    // Clear stored tokens
    chrome.storage.local.remove(['google_access_token', 'google_refresh_token']);
  }
});