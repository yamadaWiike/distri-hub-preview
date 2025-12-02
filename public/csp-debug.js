/* CSP Debug and Override */
console.log('CSP Override Script Loaded');

// Try to detect and log current CSP
if (document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
  console.log('CSP Meta tag found:', document.querySelector('meta[http-equiv="Content-Security-Policy"]').getAttribute('content'));
} else {
  console.log('No CSP meta tag found');
}

// Log if we're being blocked by CSP
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    effectiveDirective: e.effectiveDirective,
    originalPolicy: e.originalPolicy
  });
});

// Force refresh CSP awareness
console.log('Current document domain:', document.domain);
console.log('Current location:', window.location.href);