export function ThemeScript() {
  const themeScript = `
    (function() {
      'use strict';
      
      // Immediately hide body to prevent flash
      const style = document.createElement('style');
      style.innerHTML = 'body { visibility: hidden !important; }';
      document.head.appendChild(style);
      
      try {
        const theme = localStorage.getItem('bpmn-studio-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const activeTheme = theme || (prefersDark ? 'dark' : 'light');
        
        // Set theme immediately
        const root = document.documentElement;
        root.style.colorScheme = activeTheme;
        root.classList.add('theme-loading');
        
        if (activeTheme === 'dark') {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
        
        // Store current theme for later use
        window.__THEME__ = activeTheme;
        
      } catch (e) {
        // Fallback: use system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
          document.documentElement.style.colorScheme = 'dark';
          window.__THEME__ = 'dark';
        } else {
          window.__THEME__ = 'light';
        }
      }
      
      // Show body and enable transitions after DOM is ready
      function showContent() {
        requestAnimationFrame(() => {
          document.head.removeChild(style);
          document.documentElement.classList.remove('theme-loading');
          document.body.style.visibility = '';
        });
      }
      
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showContent);
      } else {
        showContent();
      }
    })();
  `;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: themeScript }}
      suppressHydrationWarning
    />
  );
}