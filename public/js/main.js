// Boot: show the app if a token exists, otherwise the login page. Re-apply role rules whenever the page content changes.
new MutationObserver(applyPerms).observe($('#main'), { childList: true, subtree: true });
tok() ? init().catch(() => {}) : showLogin();
