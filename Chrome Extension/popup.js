// Popup script for extension interface

document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  await loadRecentActivity();
  setupEventListeners();
});

async function loadStats() {
  try {
    const items = await chrome.storage.local.get(null);
    const analyses = Object.keys(items)
      .filter(key => key.startsWith('analysis_'))
      .map(key => items[key]);
    
    const emailsScanned = analyses.length;
    const threatsBlocked = analyses.filter(a => a.analysis.isPhishing).length;
    
    document.getElementById('emailsScanned').textContent = emailsScanned;
    document.getElementById('threatsBlocked').textContent = threatsBlocked;
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

async function loadRecentActivity() {
  try {
    const items = await chrome.storage.local.get(null);
    const analyses = Object.keys(items)
      .filter(key => key.startsWith('analysis_'))
      .map(key => items[key])
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 5);
    
    const activityList = document.getElementById('activityList');
    
    if (analyses.length === 0) {
      activityList.innerHTML = '<div class="empty-state">No recent activity. Open an email to start scanning.</div>';
      return;
    }
    
    activityList.innerHTML = analyses.map(item => {
      const isPhishing = item.analysis.isPhishing;
      const time = formatTime(item.timestamp);
      const subject = truncate(item.subject, 40);
      
      return `
        <div class="activity-item ${isPhishing ? 'phishing' : 'safe'}">
          <div class="activity-subject">
            ${isPhishing ? '⚠️' : '✅'} ${subject}
          </div>
          <div class="activity-time">${time}</div>
        </div>
      `;
    }).join('');
  } catch (error) {
    console.error('Error loading activity:', error);
  }
}

function setupEventListeners() {
  // Scan current email
  document.getElementById('scanNowBtn').addEventListener('click', async () => {
    const btn = document.getElementById('scanNowBtn');
    const originalText = btn.textContent;
    btn.textContent = 'Scanning...';
    btn.disabled = true;
    
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Check if we're on a supported email page
      if (!tab.url.includes('mail.google.com') && 
          !tab.url.includes('outlook.live.com') && 
          !tab.url.includes('outlook.office.com')) {
        alert('⚠️ Please open Gmail or Outlook first!\n\nThis extension only works on:\n• mail.google.com\n• outlook.live.com\n• outlook.office.com');
        btn.textContent = originalText;
        btn.disabled = false;
        return;
      }
      
      // Try to send message to content script
      chrome.tabs.sendMessage(tab.id, { action: 'analyzeCurrentEmail' }, (response) => {
        if (chrome.runtime.lastError) {
          // Content script not loaded - try to inject it
          console.log('Content script not ready, reloading page...');
          alert('⚠️ Extension needs to reload the page.\n\nClick OK and refresh the Gmail/Outlook page, then try again.');
          btn.textContent = originalText;
          btn.disabled = false;
        } else {
          // Success - reload stats
          setTimeout(async () => {
            await loadStats();
            await loadRecentActivity();
            btn.textContent = originalText;
            btn.disabled = false;
          }, 1500);
        }
      });
    } catch (error) {
      console.error('Error scanning email:', error);
      alert('❌ Error: ' + error.message + '\n\nMake sure you:\n1. Are on Gmail or Outlook\n2. Have an email open\n3. Refreshed the page after installing the extension');
      btn.textContent = originalText;
      btn.disabled = false;
    }
  });
  
  // Clear history
  document.getElementById('clearHistoryBtn').addEventListener('click', async () => {
    if (confirm('Are you sure you want to clear all history?')) {
      try {
        const items = await chrome.storage.local.get(null);
        const analysisKeys = Object.keys(items).filter(key => key.startsWith('analysis_'));
        
        await chrome.storage.local.remove(analysisKeys);
        
        await loadStats();
        await loadRecentActivity();
      } catch (error) {
        console.error('Error clearing history:', error);
      }
    }
  });
}

function formatTime(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function truncate(text, maxLength) {
  if (!text) return 'No subject';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}