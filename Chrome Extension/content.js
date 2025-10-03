// Content script that runs on email platforms
class EmailPhishingDetector {
  constructor() {
    this.platform = this.detectPlatform();
    this.analyzedEmails = new Set();
    this.init();
  }

  detectPlatform() {
    const hostname = window.location.hostname;
    if (hostname.includes('mail.google.com')) return 'gmail';
    if (hostname.includes('outlook')) return 'outlook';
    return 'unknown';
  }

  init() {
    console.log('Phishing Detector initialized on:', this.platform);
    
    // Start monitoring for emails
    this.observeEmails();
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'analyzeCurrentEmail') {
        this.checkForNewEmails(); // Use existing function instead
        sendResponse({ success: true });
      }
      return true; // Required for async response
    });
  }

  observeEmails() {
    // Use MutationObserver to detect when emails are opened/loaded
    const observer = new MutationObserver((mutations) => {
      this.checkForNewEmails();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Initial check
    setTimeout(() => this.checkForNewEmails(), 2000);
  }

  checkForNewEmails() {
    const emailContent = this.extractEmailContent();
    
    if (emailContent && !this.analyzedEmails.has(emailContent.id)) {
      this.analyzedEmails.add(emailContent.id);
      this.analyzeEmail(emailContent);
    }
  }

  extractEmailContent() {
    if (this.platform === 'gmail') {
      return this.extractGmailContent();
    } else if (this.platform === 'outlook') {
      return this.extractOutlookContent();
    }
    return null;
  }

  extractGmailContent() {
    // Gmail-specific selectors
    const emailBody = document.querySelector('.a3s.aiL') || 
                      document.querySelector('[data-message-id]');
    
    if (!emailBody) return null;

    const subjectElement = document.querySelector('.hP');
    const senderElement = document.querySelector('.gD');
    
    return {
      id: emailBody.getAttribute('data-message-id') || Date.now().toString(),
      subject: subjectElement?.textContent || '',
      sender: senderElement?.getAttribute('email') || senderElement?.textContent || '',
      body: emailBody.textContent || emailBody.innerText || '',
      html: emailBody.innerHTML,
      links: this.extractLinks(emailBody)
    };
  }

  extractOutlookContent() {
    // Outlook-specific selectors
    const emailBody = document.querySelector('[role="document"]') ||
                      document.querySelector('.rps_9d28');
    
    if (!emailBody) return null;

    const subjectElement = document.querySelector('[role="heading"]');
    const senderElement = document.querySelector('.K0PfK');
    
    return {
      id: Date.now().toString(),
      subject: subjectElement?.textContent || '',
      sender: senderElement?.textContent || '',
      body: emailBody.textContent || emailBody.innerText || '',
      html: emailBody.innerHTML,
      links: this.extractLinks(emailBody)
    };
  }

  extractLinks(element) {
    const links = element.querySelectorAll('a');
    return Array.from(links).map(link => ({
      text: link.textContent,
      href: link.href
    }));
  }

  async analyzeEmail(emailContent) {
    console.log('Analyzing email:', emailContent.subject);
    
    // Send to background script for ML analysis
    chrome.runtime.sendMessage({
      action: 'analyzeEmail',
      data: emailContent
    }, (response) => {
      if (response && response.isPhishing) {
        this.displayWarning(emailContent, response);
      }
    });
  }

  displayWarning(emailContent, analysis) {
    // Remove any existing warnings
    const existingWarning = document.querySelector('.phishing-warning-banner');
    if (existingWarning) {
      existingWarning.remove();
    }

    // Create warning banner
    const warning = document.createElement('div');
    warning.className = 'phishing-warning-banner';
    warning.innerHTML = `
      <div class="phishing-warning-content">
        <div class="phishing-warning-icon">⚠️</div>
        <div class="phishing-warning-text">
          <strong>PHISHING ALERT</strong>
          <p>This email has been identified as a potential phishing attempt.</p>
          <p class="phishing-confidence">Confidence: ${(analysis.confidence * 100).toFixed(1)}%</p>
          ${analysis.reasons ? `
            <details class="phishing-reasons">
              <summary>Why this was flagged:</summary>
              <ul>
                ${analysis.reasons.map(reason => `<li>${reason}</li>`).join('')}
              </ul>
            </details>
          ` : ''}
        </div>
        <button class="phishing-dismiss-btn" onclick="this.closest('.phishing-warning-banner').remove()">
          Dismiss
        </button>
      </div>
    `;

    // Insert warning at the top of the email
    const insertTarget = this.platform === 'gmail' 
      ? document.querySelector('.nH.if') 
      : document.querySelector('[role="main"]');
    
    if (insertTarget) {
      insertTarget.insertBefore(warning, insertTarget.firstChild);
    }

    // Also highlight suspicious links
    this.highlightSuspiciousLinks(analysis.suspiciousLinks || []);
  }

  highlightSuspiciousLinks(suspiciousLinks) {
    if (!suspiciousLinks.length) return;

    const allLinks = document.querySelectorAll('a');
    allLinks.forEach(link => {
      if (suspiciousLinks.includes(link.href)) {
        link.classList.add('phishing-suspicious-link');
        link.title = 'Warning: This link has been flagged as suspicious';
      }
    });
  }
}

// Initialize the detector
const detector = new EmailPhishingDetector();