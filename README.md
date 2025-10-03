# Phishing Email Detector - Chrome Extension

A Chrome extension that uses machine learning to detect phishing emails in real-time across Gmail, Outlook, and other email platforms.

## 🎯 Features

- **Real-time Detection**: Automatically scans emails as you open them
- **Multi-platform Support**: Works on Gmail, Outlook Web, and other email platforms
- **Visual Warnings**: Clear, prominent alerts for suspicious emails
- **Link Analysis**: Highlights suspicious links within emails
- **Activity Dashboard**: Track scanned emails and blocked threats
- **Privacy-focused**: All processing happens locally in your browser

## 📁 Project Structure

```
phishing-detector/
├── manifest.json          # Extension configuration
├── background.js          # ML model integration & processing
├── content.js            # Email detection & analysis
├── popup.html            # Extension popup interface
├── popup.js              # Popup logic
├── styles.css            # Warning banner styles
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md
```

## 🚀 Installation

### 1. Download/Clone the Extension

Create a new folder and add all the extension files above.

### 2. Add Icons

Create an `icons/` folder and add three PNG icons (16x16, 48x48, and 128x128 pixels). You can create simple shield icons or use online icon generators.

### 3. Load in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the folder containing your extension files
5. The extension should now appear in your extensions list

## 🔧 Integrating Your ML Model

The extension is designed to work with your existing ML model. Here's how to integrate it:

### Option 1: TensorFlow.js Model

If you're using TensorFlow.js:

```javascript
// In background.js, modify the loadModel() function:

async loadModel() {
  try {
    // Load your TensorFlow.js model
    this.model = await tf.loadLayersModel('chrome-extension://' + chrome.runtime.id + '/model/model.json');
    this.modelLoaded = true;
    console.log('ML model loaded successfully');
  } catch (error) {
    console.error('Error loading ML model:', error);
  }
}

// Modify the runModel() function:

async runModel(features) {
  if (!this.modelLoaded) {
    throw new Error('Model not loaded');
  }
  
  // Prepare input tensor based on your model's requirements
  const inputArray = this.prepareInputArray(features);
  const inputTensor = tf.tensor2d([inputArray]);
  
  // Run prediction
  const prediction = this.model.predict(inputTensor);
  const result = await prediction.data();
  
  // Clean up tensors
  inputTensor.dispose();
  prediction.dispose();
  
  return {
    confidence: result[0],
    isPhishing: result[0] > 0.5
  };
}
```

### Option 2: ONNX Runtime

If you're using ONNX format:

```javascript
// Add ONNX Runtime to your extension
// Include: <script src="https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js"></script>

async loadModel() {
  try {
    this.model = await ort.InferenceSession.create('model/model.onnx');
    this.modelLoaded = true;
  } catch (error) {
    console.error('Error loading ONNX model:', error);
  }
}

async runModel(features) {
  const inputArray = this.prepareInputArray(features);
  const tensor = new ort.Tensor('float32', inputArray, [1, inputArray.length]);
  
  const results = await this.model.run({ input: tensor });
  const output = results.output.data;
  
  return {
    confidence: output[0],
    isPhishing: output[0] > 0.5
  };
}
```

### Option 3: API-based Model

If your ML model is hosted as an API:

```javascript
async runModel(features) {
  try {
    const response = await fetch('https://your-api-endpoint.com/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_API_KEY'
      },
      body: JSON.stringify({ features })
    });
    
    const result = await response.json();
    
    return {
      confidence: result.confidence,
      isPhishing: result.is_phishing
    };
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
```

## 🎨 Customizing Features

### Add Custom Features

Modify the `extractFeatures()` function in `background.js`:

```javascript
extractFeatures(emailData) {
  return {
    // Basic features
    subject: emailData.subject,
    body: emailData.body,
    sender: emailData.sender,
    
    // Your custom features
    subjectLength: emailData.subject.length,
    bodyLength: emailData.body.length,
    linkCount: emailData.links.length,
    hasAttachments: this.detectAttachments(emailData.html),
    
    // Add any features your ML model requires
    customFeature1: this.extractCustomFeature1(emailData),
    customFeature2: this.extractCustomFeature2(emailData),
    // ... more features
  };
}
```

### Adjust Detection Threshold

Change the confidence threshold in `background.js`:

```javascript
analyzeResults(prediction, emailData) {
  const threshold = 0.5; // Adjust this (0.0 to 1.0)
  const isPhishing = prediction.confidence > threshold;
  // ... rest of the code
}
```

## 🧪 Testing

1. **Test on Gmail**: Go to gmail.com and open various emails
2. **Test on Outlook**: Go to outlook.com and open emails
3. **Check Console**: Open DevTools (F12) to see detection logs
4. **View Popup**: Click the extension icon to see statistics

### Test with Known Phishing Examples

Create test emails with common phishing indicators:
- Urgent language ("Act now!", "Account suspended")
- Mismatched sender domains
- Suspicious links
- IP addresses instead of domain names

## 📊 Monitoring Performance

The extension logs all analyses to Chrome storage. Access them via:

```javascript
chrome.storage.local.get(null, (items) => {
  const analyses = Object.keys(items)
    .filter(key => key.startsWith('analysis_'))
    .map(key => items[key]);
  console.log(analyses);
});
```

## 🔒 Privacy & Security

- All processing happens locally in the browser
- No email content is sent to external servers (unless using API-based model)
- Email data is stored temporarily only for analysis history
- History can be cleared anytime via the popup

## 🐛 Troubleshooting

### Extension Not Working

1. Check if extension is enabled in `chrome://extensions/`
2. Verify you're on a supported email platform
3. Check browser console for errors (F12)

### Model Not Loading

1. Ensure model files are in the correct location
2. Check file paths in `manifest.json` web_accessible_resources
3. Verify model format matches your integration code

### Emails Not Being Scanned

1. Try refreshing the email page
2. Open DevTools and check for console errors
3. Click "Scan Current Email" in the popup manually

## 🔄 Updates & Improvements

### Future Enhancements

- [ ] Support for more email platforms
- [ ] Whitelist trusted senders
- [ ] Export detection reports
- [ ] Real-time learning from user feedback
- [ ] Multi-language support

## 📝 License

MIT License - Feel free to modify and distribute

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## 📧 Support

For issues or questions:
- Check the browser console for error messages
- Review the code comments for implementation details
- Test with the manual "Scan Current Email" button first

---

**Note**: This extension requires your pre-trained ML model. Make sure to integrate your model following the instructions above before deploying.