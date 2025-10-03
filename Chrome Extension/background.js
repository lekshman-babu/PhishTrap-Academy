// Background service worker - handles ML model processing

importScripts('ml-integration.js');

class PhishingMLService {
  constructor() {
    this.model = null;
    this.modelLoaded = false;
    this.init();
  }

  async init() {
    console.log('Phishing ML Service initialized');
    
    // Listen for messages from content scripts
    if (this.mlIntegration.modelType === 'tensorflow') {
      await this.mlIntegration.loadTensorFlowModel();
    } else if (this.mlIntegration.modelType === 'onnx') {
      await this.mlIntegration.loadONNXModel();
    }
    
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'analyzeEmail') {
        this.processEmail(request.data).then(sendResponse);
        return true;
      }
    });

    // Load your ML model
    await this.loadModel();
  }

  async loadModel() {
    try {
      // TODO: Replace this with your actual ML model loading
      // Example for TensorFlow.js:
      // this.model = await tf.loadLayersModel('path/to/your/model.json');
      
      // For now, we'll use a placeholder
      console.log('Loading ML model...');
      
      // Simulate model loading
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.modelLoaded = true;
      console.log('ML model loaded successfully');
    } catch (error) {
      console.error('Error loading ML model:', error);
    }
  }

  async processEmail(emailData) {
    console.log('Processing email:', emailData.subject);

    try {
      // Use our ML integration
      const prediction = await this.mlIntegration.predict(emailData);
      
      return {
        isPhishing: prediction.isPhishing,
        confidence: prediction.confidence,
        reasons: prediction.reasons || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Prediction error:', error);
      return { isPhishing: false, error: error.message };
    }
  }

  extractFeatures(emailData) {
    // Extract relevant features for your ML model
    return {
      // Text features
      subject: emailData.subject,
      body: emailData.body,
      sender: emailData.sender,
      
      // Metadata features
      linkCount: emailData.links.length,
      hasAttachments: this.detectAttachments(emailData.html),
      
      // Suspicious patterns
      urgencyWords: this.countUrgencyWords(emailData.body),
      suspiciousLinks: this.analyzeSuspiciousLinks(emailData.links),
      senderMismatch: this.checkSenderMismatch(emailData),
      
      // Add more features based on your ML model requirements
    };
  }

  async runModel(features) {
    // TODO: Replace with your actual ML model prediction
    // Example for TensorFlow.js:
    // const tensor = tf.tensor2d([Object.values(features)]);
    // const prediction = await this.model.predict(tensor);
    // return prediction.dataSync()[0];
    
    // Placeholder implementation using heuristics
    return this.heuristicAnalysis(features);
  }

  heuristicAnalysis(features) {
    // Temporary heuristic-based analysis
    // Replace this with your actual ML model
    let score = 0;
    
    // Check for urgency words
    if (features.urgencyWords > 3) score += 0.3;
    
    // Check for suspicious links
    if (features.suspiciousLinks.length > 0) score += 0.4;
    
    // Check for sender mismatch
    if (features.senderMismatch) score += 0.3;
    
    // Check for excessive links
    if (features.linkCount > 10) score += 0.2;
    
    return {
      confidence: Math.min(score, 1.0),
      isPhishing: score > 0.5
    };
  }

  analyzeResults(prediction, emailData) {
    const isPhishing = prediction.isPhishing || prediction.confidence > 0.5;
    const confidence = prediction.confidence || 0;
    
    // Identify specific reasons
    const reasons = [];
    
    if (this.countUrgencyWords(emailData.body) > 2) {
      reasons.push('Contains urgent language (e.g., "act now", "urgent action required")');
    }
    
    const suspiciousLinks = this.analyzeSuspiciousLinks(emailData.links);
    if (suspiciousLinks.length > 0) {
      reasons.push(`Contains ${suspiciousLinks.length} suspicious link(s)`);
    }
    
    if (this.checkSenderMismatch(emailData)) {
      reasons.push('Sender email domain doesn\'t match claimed organization');
    }
    
    if (emailData.links.some(link => this.isIPAddress(link.href))) {
      reasons.push('Links to IP addresses instead of domain names');
    }

    return {
      isPhishing,
      confidence,
      reasons,
      suspiciousLinks,
      timestamp: new Date().toISOString()
    };
  }

  countUrgencyWords(text) {
    const urgencyWords = [
      'urgent', 'immediately', 'act now', 'verify now', 'confirm now',
      'suspended', 'locked', 'unusual activity', 'verify your account',
      'click here now', 'limited time', 'expire', 'action required'
    ];
    
    const lowerText = text.toLowerCase();
    return urgencyWords.filter(word => lowerText.includes(word)).length;
  }

  analyzeSuspiciousLinks(links) {
    const suspicious = [];
    
    links.forEach(link => {
      // Check for link text vs href mismatch
      if (link.text && link.href && !link.href.includes(link.text)) {
        const textDomain = this.extractDomain(link.text);
        const hrefDomain = this.extractDomain(link.href);
        
        if (textDomain && hrefDomain && textDomain !== hrefDomain) {
          suspicious.push(link.href);
        }
      }
      
      // Check for IP addresses
      if (this.isIPAddress(link.href)) {
        suspicious.push(link.href);
      }
      
      // Check for shortened URLs
      if (this.isShortURL(link.href)) {
        suspicious.push(link.href);
      }
    });
    
    return suspicious;
  }

  checkSenderMismatch(emailData) {
    // Check if sender email matches the domain mentioned in the email
    const senderDomain = this.extractDomain(emailData.sender);
    const bodyDomains = this.extractDomainsFromText(emailData.body);
    
    // Common legitimate domains
    const trustedDomains = ['paypal.com', 'amazon.com', 'bank.com'];
    
    for (const domain of bodyDomains) {
      if (trustedDomains.includes(domain) && !senderDomain.includes(domain)) {
        return true;
      }
    }
    
    return false;
  }

  extractDomain(text) {
    if (!text) return '';
    const match = text.match(/(?:@|https?:\/\/)([^\/\s]+)/i);
    return match ? match[1].toLowerCase() : '';
  }

  extractDomainsFromText(text) {
    const regex = /(?:@|https?:\/\/)([a-z0-9.-]+\.[a-z]{2,})/gi;
    const matches = text.matchAll(regex);
    return [...new Set([...matches].map(m => m[1].toLowerCase()))];
  }

  isIPAddress(url) {
    const ipPattern = /^https?:\/\/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/;
    return ipPattern.test(url);
  }

  isShortURL(url) {
    const shortURLDomains = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly'];
    return shortURLDomains.some(domain => url.includes(domain));
  }

  detectAttachments(html) {
    return html.includes('attachment') || html.includes('download');
  }

  async storeAnalysis(emailData, analysis) {
    // Store analysis results in chrome.storage
    const key = `analysis_${Date.now()}`;
    const data = {
      subject: emailData.subject,
      sender: emailData.sender,
      analysis: analysis,
      timestamp: new Date().toISOString()
    };
    
    try {
      await chrome.storage.local.set({ [key]: data });
      
      // Keep only last 100 analyses
      const items = await chrome.storage.local.get(null);
      const keys = Object.keys(items).filter(k => k.startsWith('analysis_'));
      
      if (keys.length > 100) {
        const oldestKeys = keys.sort().slice(0, keys.length - 100);
        await chrome.storage.local.remove(oldestKeys);
      }
    } catch (error) {
      console.error('Error storing analysis:', error);
    }
  }
}

// Initialize the service
const mlService = new PhishingMLService();