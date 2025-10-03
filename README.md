# 🧘 AI Mental Wellness Companion

**Chrome Extension for Google Chrome AI Challenge 2025**

An intelligent Chrome extension that promotes mental wellness using **Chrome's Built-in AI APIs**. Analyzes emotional tone, provides smart interventions, and offers AI-powered guided wellness exercises.

---

## 🌟 Key Features

- **🤖 AI Emotion Analysis** - Real-time detection using `chrome.ai.languageModel`
- **🔔 Smart Interventions** - Context-aware wellness suggestions
- **💆 Guided Exercises** - Breathing, AI affirmations, mindfulness
- **📊 Analytics Dashboard** - Track emotional patterns with charts
- **🔒 Privacy-First** - 100% local processing, no external servers

---

## 🏆 Chrome AI APIs Used

✅ **`chrome.ai.languageModel`** - Emotion analysis, affirmations, mindfulness tips  
✅ **`chrome.ai.summarizer`** - Content simplification (ready)  
✅ **`chrome.ai.translator`** - Multi-language support (ready)

---

## 📁 Project Structure

```
├── manifest.json          # Extension config with AI permissions
├── background.js          # Service worker (notifications, tracking)
├── content.js             # Page analysis with Chrome AI
├── ai-service.js          # Chrome AI integration layer ⭐
├── popup.html/js          # Modern popup interface
├── dashboard.html/js      # Analytics with charts
├── options.html/js        # Settings page
├── exercises/             # Breathing, affirmation, mindfulness
└── styles/                # CSS + icons
```

---

## 🌍 Multi-Language Support

**Multilingual Emotion Analysis - Works Out of the Box**

The extension analyzes content in **5+ languages** automatically without requiring translation:

### **Current Implementation (Ready to Use):**
- ✅ **Multilingual Keyword Analysis**: Built-in support for English, Portuguese, Spanish, French, German
- ✅ **Direct Emotion Detection**: Detects emotional keywords in their native language
- ✅ **No Translation Required**: Works immediately without external APIs
- ✅ **Privacy-First**: Everything processed locally

**Supported Languages:**
- 🇺🇸 English - 🇧🇷 Portuguese - 🇪🇸 Spanish - 🇫🇷 French - 🇩🇪 German

### **Future Enhancement (Chrome AI Translator):**
The extension is **ready** to use Chrome's Translation API when available:
- 🔄 **Translation API**: Currently in Early Preview Program (EPP) only
- 📝 **Code Ready**: Will automatically activate when API becomes public
- 🚀 **Enhanced Accuracy**: Will provide even better analysis when available

**How it works NOW:**
1. Page content is extracted in any supported language
2. Multilingual keyword matcher detects emotions directly (no translation needed)
3. Emotion analysis runs on original text
4. User sees contextual wellness interventions

**Status Indicators:**
- ✅ "Chrome AI active - Enhanced analysis enabled" (Language Model working)
- ✅ "Using multilingual analysis (supports 5+ languages)" (Fallback working perfectly)
- ❌ "Chrome AI not available - Using fallback analysis" (No AI, but still multilingual)

---

## 🚀 Quick Start

### 1. Enable Chrome AI

```
chrome://flags
  → #optimization-guide-on-device-model: Enabled
  → #prompt-api-for-gemini-nano: Enabled
  → Restart Chrome
```

### 2. Download AI Models

```
chrome://components
  → "Optimization Guide On Device Model"
  → Click "Check for update"
  → Wait 5-10 minutes
```

### 3. Install Extension

```
chrome://extensions
  → Enable Developer mode
  → Load unpacked → Select folder
  → Extension appears in toolbar 🧘
```

### 4. Verify

- Click extension icon
- See "✨ AI-powered emotion analysis active"
- Browse websites → AI analyzes content automatically

---

## 💡 How It Works

1. **Browse** → Extension analyzes page content
2. **AI Detects** → Identifies emotional tone (positive/negative/anxiety/anger)
3. **Smart Alert** → Shows beautiful banner if needed
4. **Exercise** → Recommends breathing/affirmation/mindfulness
5. **Track** → Dashboard shows patterns and insights

---

## 🎯 Key Files Explained

### `ai-service.js` - Core AI Integration
```javascript
// Emotion analysis
AIService.analyzeEmotion(text) → { emotion, score, suggestion }

// AI-generated content
AIService.generateAffirmation(emotion) → personalized affirmation
AIService.generateMindfulnessTip(emotion) → contextual tip
```

### `content.js` - Page Analysis
- Extracts visible text from webpages
- Calls AI for emotion detection
- Shows intervention banners
- Adaptive recommendations

### `background.js` - Service Worker
- Manages notifications and alarms
- Tracks emotion/exercise history
- Data retention (7-30 days auto-cleanup)

---

## 🧪 Testing

### Test AI Availability
```javascript
// In console
const status = await window.AIService.checkAIAvailability();
console.log(status); // { languageModel: true, ... }
```

### Test Emotion Analysis
```javascript
const result = await window.AIService.analyzeEmotion("I'm stressed!");
console.log(result);
// { emotion: "anxiety", score: 0.8, source: "chrome-ai" }
```

### Manual Testing
1. Visit stressful news sites → Banner should appear
2. Try each exercise → Check AI-generated content
3. View dashboard → Verify charts and insights
4. Change settings → Test persistence

---

## ⚙️ Configuration

**Settings Page (`options.html`):**
- Sensitivity: Low/Medium/High
- Enable/disable notifications
- Reminder interval (15-240 min)
- Select emotions to track
- Choose preferred exercises

---

## 🔒 Privacy & Data

**What's Stored Locally:**
- Emotion history (7 days)
- Exercise records (30 days)
- User preferences

**Privacy Features:**
- No external servers
- No analytics/tracking
- One-click data deletion
- JSON data export

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| AI not working | Check `chrome://flags`, download models, restart |
| Banner not showing | Increase sensitivity, enable notifications |
| No dashboard data | Browse more pages, wait for analysis |

**AI Status Check:**
```
chrome://flags → Verify AI flags enabled
chrome://components → Check model downloaded
Console → "[Wellness Companion] Chrome AI ready"
```

---

## 🎨 Design Highlights

- **Beautiful gradients** (purple/blue theme)
- **Smooth animations** (CSS transitions)
- **Accessible** (ARIA labels, keyboard shortcuts)
- **Responsive** (works on all screens)
- **Non-intrusive** (gentle interventions)

---

## 🚀 Future Enhancements

- Voice guidance (Web Speech API)
- Advanced ML pattern detection
- Multi-language via `chrome.ai.translator`
- Gamification (streaks, achievements)
- Health app integrations

---

## 📊 Competition Highlights

**Why This Project Wins:**
1. ✅ Original concept (not another summarizer)
2. ✅ Real-world impact (mental health)
3. ✅ Deep AI integration (multiple APIs)
4. ✅ Production-ready UI/UX
5. ✅ True privacy (local-first)
6. ✅ Well-documented code

**Technical Innovation:**
- Custom AI prompts for emotion classification
- Fallback strategy for AI unavailability
- Adaptive recommendations
- Real-time analysis without blocking

---

## 👨‍💻 Tech Stack

- Vanilla JavaScript (ES6+)
- Chrome Extension APIs (Manifest V3)
- Chrome Built-in AI APIs
- Modern CSS3
- No external dependencies

---

## 📝 License

Created for **Google Chrome AI Challenge 2025** - Educational/Competition purposes.

---

## 🙏 Credits

Built with 💜 to demonstrate Chrome's Built-in AI for mental wellness.

**Goal:** Make the web a healthier, more mindful place.

---

## 📬 Quick Links

- **AI Flags:** `chrome://flags`
- **Components:** `chrome://components`
- **Extensions:** `chrome://extensions`
- **Console:** F12 → Look for "[Wellness Companion]" logs

---

**Made with Chrome Built-in AI** ✨  
*Promoting mental wellness, one webpage at a time* 🧘‍♀️

