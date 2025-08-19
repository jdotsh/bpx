// Force Task Fix Script - Run this in browser console if Tasks are still not visible

function forceFixTasks() {
  const isDark = document.documentElement.classList.contains('dark');
  console.log('Forcing Task fix for', isDark ? 'DARK' : 'LIGHT', 'mode');
  
  // Method 1: Fix all Task rectangles directly
  const tasks = document.querySelectorAll('[data-element-id*="Task"]');
  let fixedCount = 0;
  
  tasks.forEach(task => {
    const rects = task.querySelectorAll('rect');
    rects.forEach(rect => {
      const oldStroke = rect.getAttribute('stroke');
      const newStroke = isDark ? '#ffffff' : '#000000';
      const newFill = isDark ? '#1f2937' : '#ffffff';
      
      // Force both attribute and style
      rect.setAttribute('stroke', newStroke);
      rect.style.stroke = newStroke;
      rect.style.strokeOpacity = '1';
      rect.style.strokeWidth = '2px';
      
      // Skip selection boxes
      if (!rect.closest('.djs-outline') && !rect.closest('.djs-selection')) {
        rect.setAttribute('fill', newFill);
        rect.style.fill = newFill;
      }
      
      console.log(`Fixed Task rect: ${oldStroke} → ${newStroke}`);
      fixedCount++;
    });
  });
  
  // Method 2: Inject override styles
  let styleEl = document.getElementById('task-force-fix');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'task-force-fix';
    document.head.appendChild(styleEl);
  }
  
  styleEl.textContent = `
    /* FORCE ALL TASKS TO BE VISIBLE */
    [data-element-id*="Task"] rect {
      stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      stroke-opacity: 1 !important;
      stroke-width: 2px !important;
    }
    
    [data-element-id*="Task"] .djs-visual > rect {
      stroke: ${isDark ? '#ffffff' : '#000000'} !important;
      fill: ${isDark ? '#1f2937' : '#ffffff'} !important;
    }
    
    /* Force ALL rectangles in dark mode */
    ${isDark ? `
      g.djs-element rect[stroke="#000000"],
      g.djs-element rect[stroke="black"],
      g.djs-element rect[stroke="rgb(0, 0, 0)"] {
        stroke: #ffffff !important;
      }
    ` : ''}
  `;
  
  console.log(`✅ Fixed ${fixedCount} Task rectangles`);
  console.log('✅ Injected override styles');
  
  // Method 3: Set up continuous monitoring
  if (!window.taskFixInterval) {
    window.taskFixInterval = setInterval(() => {
      const blackRects = document.querySelectorAll(
        isDark ? 
        '[data-element-id*="Task"] rect[stroke="#000000"], [data-element-id*="Task"] rect[stroke="black"]' :
        '[data-element-id*="Task"] rect[stroke="#ffffff"], [data-element-id*="Task"] rect[stroke="white"]'
      );
      
      if (blackRects.length > 0) {
        console.log(`Found ${blackRects.length} incorrectly colored Tasks, fixing...`);
        blackRects.forEach(rect => {
          rect.setAttribute('stroke', isDark ? '#ffffff' : '#000000');
          rect.style.stroke = isDark ? '#ffffff' : '#000000';
        });
      }
    }, 1000);
    
    console.log('✅ Started continuous Task monitoring');
  }
}

// Run immediately
forceFixTasks();

// Also run on theme changes
const observer = new MutationObserver((mutations) => {
  mutations.forEach((mutation) => {
    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
      console.log('Theme changed, re-fixing Tasks...');
      setTimeout(forceFixTasks, 100);
    }
  });
});

observer.observe(document.documentElement, {
  attributes: true,
  attributeFilter: ['class']
});

console.log('Task Force Fix loaded. Tasks should now be visible in both light and dark modes.');