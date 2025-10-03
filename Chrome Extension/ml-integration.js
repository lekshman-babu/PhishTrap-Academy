// ML Model Integration Template
// Choose the appropriate method based on your model format

class MLModelIntegration {
  constructor() {
    this.model = null;
    this.modelLoaded = false;
    this.modelType = 'tensorflow'; // 'tensorflow', 'onnx', 'api', 'custom'
  }

  // ========================================
  // METHOD 1: TensorFlow.js Integration
  // ========================================
  async loadTensorFlowModel() {
    try {
      // Option A: Load from extension files
      const modelPath = chrome.runtime.getURL('model/model.json');
      this.model = await tf.loadLayersModel(modelPath);
      
      // Option B: Load from URL
      // this.model = await tf.loadLayersModel('https://your-server.com/model.json');
      
      // Option C: Load GraphModel (for converted models)
      // this.model = await tf.loadGraphModel(modelPath);
      
      this.modelLoaded = true;
      console.log('TensorFlow model loaded');
      return true;
    } catch (error) {
      console.error('Error loading TensorFlow model:', error);
      return false;
    }
  }

  async predictTensorFlow(features) {
    if (!this.modelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      // Prepare input based on your model's expected shape
      // Example: If model expects [batch_size, num_features]
      const inputArray = this.prepareTensorFlowInput(features);
      const inputTensor = tf.tensor2d([inputArray]); // Shape: [1, num_features]
      
      // Run prediction
      const prediction = this.model.predict(inputTensor);
      const result = await prediction.data();
      
      // Cleanup
      inputTensor.dispose();
      prediction.dispose();
      
      return {
        confidence: result[0], // Adjust based on your model's output
        isPhishing: result[0] > 0.5,
        rawOutput: Array.from(result)
      };
    } catch (error) {
      console.error('TensorFlow prediction error:', error);
      throw error;
    }
  }

  prepareTensorFlowInput(features) {
    // TODO: Convert your features object into a flat array
    // This depends on what features your model was trained on
    
    // Example: Simple feature array
    return [
      features.subjectLength || 0,
      features.bodyLength || 0,
      features.linkCount || 0,
      features.urgencyWords || 0,
      features.suspiciousLinks.length || 0,
      features.hasAttachments ? 1 : 0,
      features.senderMismatch ? 1 : 0,
      // Add all your features in the EXACT order your model expects
    ];
  }

  // ========================================
  // METHOD 2: ONNX Runtime Integration
  // ========================================
  async loadONNXModel() {
    try {
      const modelPath = chrome.runtime.getURL('model/model.onnx');
      
      // Fetch the model file
      const response = await fetch(modelPath);
      const arrayBuffer = await response.arrayBuffer();
      
      // Create inference session
      this.model = await ort.InferenceSession.create(arrayBuffer);
      
      this.modelLoaded = true;
      console.log('ONNX model loaded');
      console.log('Input names:', this.model.inputNames);
      console.log('Output names:', this.model.outputNames);
      return true;
    } catch (error) {
      console.error('Error loading ONNX model:', error);
      return false;
    }
  }

  async predictONNX(features) {
    if (!this.modelLoaded) {
      throw new Error('Model not loaded');
    }

    try {
      const inputArray = this.prepareONNXInput(features);
      const inputName = this.model.inputNames[0]; // Get first input name
      
      // Create tensor (adjust dimensions based on your model)
      const tensor = new ort.Tensor('float32', inputArray, [1, inputArray.length]);
      
      // Run inference
      const feeds = { [inputName]: tensor };
      const results = await this.model.run(feeds);
      
      const outputName = this.model.outputNames[0];
      const output = results[outputName].data;
      
      return {
        confidence: output[0],
        isPhishing: output[0] > 0.5,
        rawOutput: Array.from(output)
      };
    } catch (error) {
      console.error('ONNX prediction error:', error);
      throw error;
    }
  }

  prepareONNXInput(features) {
    // Same as TensorFlow - convert features to array
    return this.prepareTensorFlowInput(features);
  }

  // ========================================
  // METHOD 3: API-Based Integration
  // ========================================
  async predictAPI(features) {
    try {
      const API_ENDPOINT = 'https://your-api.com/predict'; // TODO: Set your API endpoint
      const API_KEY = 'your-api-key'; // TODO: Set your API key (better to use environment variable)
      
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
          // Add any other headers your API requires
        },
        body: JSON.stringify({
          // Structure this based on your API's expected format
          email_data: {
            subject: features.subject,
            body: features.body,
            sender: features.sender,
            links: features.links
          },
          // Or send processed features
          features: this.prepareAPIInput(features)
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      // Adjust based on your API's response format
      return {
        confidence: result.confidence || result.score || result.probability,
        isPhishing: result.is_phishing || result.prediction === 1,
        rawOutput: result
      };
    } catch (error) {
      console.error('API prediction error:', error);
      throw error;
    }
  }

  prepareAPIInput(features) {
    // Convert features to whatever format your API expects
    return {
      subject_length: features.subjectLength,
      body_length: features.bodyLength,
      link_count: features.linkCount,
      urgency_score: features.urgencyWords,
      suspicious_links: features.suspiciousLinks.length,
      has_attachments: features.hasAttachments,
      sender_mismatch: features.senderMismatch
      // Add all features your API expects
    };
  }

  // ========================================
  // METHOD 4: Text Preprocessing for NLP Models
  // ========================================
  async predictNLPModel(features) {
    // If your model uses text embeddings (BERT, etc.)
    
    try {
      // Combine email text
      const fullText = `${features.subject} ${features.body}`.toLowerCase();
      
      // Option A: Use pre-trained embeddings from a library
      // const embedding = await this.getTextEmbedding(fullText);
      
      // Option B: Simple tokenization and padding
      const tokens = this.tokenizeText(fullText);
      const paddedTokens = this.padSequence(tokens, 512); // Max length
      
      // Create tensor and predict
      const inputTensor = tf.tensor2d([paddedTokens]);
      const prediction = this.model.predict(inputTensor);
      const result = await prediction.data();
      
      inputTensor.dispose();
      prediction.dispose();
      
      return {
        confidence: result[0],
        isPhishing: result[0] > 0.5
      };
    } catch (error) {
      console.error('NLP prediction error:', error);
      throw error;
    }
  }

  tokenizeText(text) {
    // Simple word tokenization
    // Replace with your actual tokenizer if needed
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 0)
      .map(word => this.wordToIndex(word));
  }

  wordToIndex(word) {
    // TODO: Load your vocabulary mapping
    // Return index from your training vocabulary
    // For now, simple hash function
    let hash = 0;
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i);
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash) % 10000; // Vocabulary size
  }

  padSequence(tokens, maxLength) {
    if (tokens.length >= maxLength) {
      return tokens.slice(0, maxLength);
    }
    return [...tokens, ...new Array(maxLength - tokens.length).fill(0)];
  }

  // ========================================
  // METHOD 5: Scikit-learn Models (via API)
  // ========================================
  async predictScikitLearn(features) {
    // Scikit-learn models need to run server-side via API
    // Create a Flask/FastAPI endpoint that loads your pickle file
    
    /*
    Python server example:
    
    from flask import Flask, request, jsonify
    import pickle
    
    app = Flask(__name__)
    model = pickle.load(open('model.pkl', 'rb'))
    
    @app.route('/predict', methods=['POST'])
    def predict():
        data = request.json
        features = [data['features']]  # Convert to format your model expects
        prediction = model.predict_proba(features)[0]
        return jsonify({
            'confidence': float(prediction[1]),
            'is_phishing': bool(prediction[1] > 0.5)
        })
    */
    
    return this.predictAPI(features);
  }

  // ========================================
  // Utility Methods
  // ========================================
  
  // Feature extraction utilities
  extractNumericFeatures(emailData) {
    return {
      subjectLength: emailData.subject?.length || 0,
      bodyLength: emailData.body?.length || 0,
      linkCount: emailData.links?.length || 0,
      capitalLetterRatio: this.calculateCapitalRatio(emailData.body),
      specialCharCount: this.countSpecialChars(emailData.body),
      urlShortenersCount: this.countURLShorteners(emailData.links),
      suspiciousKeywordCount: this.countSuspiciousKeywords(emailData.body),
      // Add more features as needed
    };
  }

  calculateCapitalRatio(text) {
    if (!text) return 0;
    const capitals = text.match(/[A-Z]/g);
    return capitals ? capitals.length / text.length : 0;
  }

  countSpecialChars(text) {
    if (!text) return 0;
    return (text.match(/[!@#$%^&*()]/g) || []).length;
  }

  countURLShorteners(links) {
    const shorteners = ['bit.ly', 'tinyurl', 'goo.gl', 't.co', 'ow.ly'];
    return links.filter(link => 
      shorteners.some(s => link.href?.includes(s))
    ).length;
  }

  countSuspiciousKeywords(text) {
    const keywords = [
      'urgent', 'verify', 'suspended', 'click here', 'confirm',
      'winner', 'congratulations', 'prize', 'refund', 'tax'
    ];
    const lowerText = text?.toLowerCase() || '';
    return keywords.filter(kw => lowerText.includes(kw)).length;
  }

  // Performance monitoring
  async testModelPerformance() {
    const testEmails = [
      {
        subject: 'URGENT: Verify your account now!',
        body: 'Click here immediately to verify your account or it will be suspended.',
        sender: 'noreply@suspicious-domain.com',
        links: [{ href: 'http://bit.ly/fake123' }]
      },
      {
        subject: 'Meeting tomorrow',
        body: 'Hi, just confirming our meeting tomorrow at 2pm.',
        sender: 'colleague@company.com',
        links: []
      }
    ];

    console.log('Testing model performance...');
    
    for (const email of testEmails) {
      const start = performance.now();
      const result = await this.predict(email);
      const duration = performance.now() - start;
      
      console.log({
        subject: email.subject,
        isPhishing: result.isPhishing,
        confidence: result.confidence,
        duration: `${duration.toFixed(2)}ms`
      });
    }
  }

  // Main predict method - delegates to appropriate implementation
  async predict(emailData) {
    const features = this.extractFeatures(emailData);
    
    switch (this.modelType) {
      case 'tensorflow':
        return this.predictTensorFlow(features);
      case 'onnx':
        return this.predictONNX(features);
      case 'api':
        return this.predictAPI(features);
      case 'nlp':
        return this.predictNLPModel(features);
      default:
        throw new Error('Model type not set. Set this.modelType in constructor.');
    }
  }

  extractFeatures(emailData) {
    // Combine all feature extraction
    return {
      // Raw data
      subject: emailData.subject,
      body: emailData.body,
      sender: emailData.sender,
      links: emailData.links,
      
      // Numeric features
      ...this.extractNumericFeatures(emailData),
      
      // Boolean features
      hasAttachments: emailData.html?.includes('attachment'),
      senderMismatch: this.checkSenderMismatch(emailData),
      
      // Array features
      suspiciousLinks: this.findSuspiciousLinks(emailData.links)
    };
  }

  checkSenderMismatch(emailData) {
    // Implement sender verification logic
    return false; // Placeholder
  }

  findSuspiciousLinks(links) {
    // Implement suspicious link detection
    return []; // Placeholder
  }
}

// Export for use in background.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MLModelIntegration;
}