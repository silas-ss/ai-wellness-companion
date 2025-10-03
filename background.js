// background.js
// Background service worker: manages alarms, notifications, emotion tracking, and adaptive recommendations
// Uses Chrome Built-in AI for intelligent wellness interventions

const WELLNESS_ALARM = "wellnessReminder";

// Default configuration (can be overridden by user in settings)
const DEFAULT_CONFIG = {
  reminderIntervalMinutes: 120,
  sensitivity: "medium",
  enabledNotifications: true,
  trackEmotions: {
    positive: true,
    negative: true,
    anxiety: true,
    anger: true,
    neutral: true
  },
  preferredExercises: {
    breathing: true,
    affirmation: true,
    mindfulness: true
  },
  exerciseDuration: 60, // seconds
  enableSoundEffects: true,
  highContrastMode: false
};

// Helper: get configuration from storage
async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (items) => resolve(items));
  });
}

// Setup alarm on install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("[Wellness Companion] Extension installed");
  
  const cfg = await getConfig();
  chrome.alarms.create(WELLNESS_ALARM, { 
    periodInMinutes: cfg.reminderIntervalMinutes 
  });
  
  // Initialize storage
  chrome.storage.local.get({ emotionHistory: [], exerciseHistory: [] }, (data) => {
    if (!data.emotionHistory) {
      chrome.storage.local.set({ 
        emotionHistory: [], 
        exerciseHistory: [],
        installDate: Date.now()
      });
    }
  });
});

// Listen for storage changes (e.g., user changed settings)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.reminderIntervalMinutes) {
    const newVal = changes.reminderIntervalMinutes.newValue;
    chrome.alarms.clear(WELLNESS_ALARM, () => {
      chrome.alarms.create(WELLNESS_ALARM, { periodInMinutes: newVal });
    });
  }
});

// Alarm triggered: send wellness notification
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === WELLNESS_ALARM) {
    const cfg = await getConfig();
    if (!cfg.enabledNotifications) return;
    
    // Get recent emotion history to personalize message
    chrome.storage.local.get({ emotionHistory: [] }, (data) => {
      const recentEmotions = data.emotionHistory.slice(-10);
      const negativeCount = recentEmotions.filter(e => 
        ["anxiety", "anger", "negative"].includes(e.emotion)
      ).length;
      
      let message = "You've been browsing for a while. Take a moment to recharge.";
      
      if (negativeCount > 5) {
        message = "Detected stressful content recently. Time for a wellness break?";
      }
      
      chrome.notifications.create({
        type: "basic",
        iconUrl: "styles/icon192x192.png",
        title: "🧘 Wellness Check-in",
        message: message,
        priority: 2,
        buttons: [
          { title: "Start Exercise" },
          { title: "Later" }
        ]
      });
    });
  }
});

// Handle notification clicks
chrome.notifications.onClicked.addListener((notificationId) => {
  chrome.tabs.create({ url: chrome.runtime.getURL("exercises/breathing.html") });
  chrome.notifications.clear(notificationId);
});

chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    // Start Exercise button
    chrome.tabs.create({ url: chrome.runtime.getURL("exercises/breathing.html") });
  }
  chrome.notifications.clear(notificationId);
});

// Adaptive recommendation engine
function getRecommendedExercise(emotion, cfg) {
  const exercises = [];
  
  // Build list of preferred exercises
  if (cfg.preferredExercises && cfg.preferredExercises.breathing) exercises.push("breathing");
  if (cfg.preferredExercises && cfg.preferredExercises.affirmation) exercises.push("affirmation");
  if (cfg.preferredExercises && cfg.preferredExercises.mindfulness) exercises.push("mindfulness");
  
  // If no preferences, use all
  if (exercises.length === 0) {
    exercises.push("breathing", "affirmation", "mindfulness");
  }
  
  // Emotion-based recommendations
  const recommendations = {
    anxiety: ["breathing", "mindfulness"],
    anger: ["breathing", "mindfulness"],
    negative: ["affirmation", "mindfulness"],
    positive: ["affirmation"],
    neutral: ["breathing", "affirmation", "mindfulness"]
  };
  
  const suggested = recommendations[emotion] || recommendations.neutral;
  
  // Find first match between suggested and user preferences
  for (const ex of suggested) {
    if (exercises.includes(ex)) return ex;
  }
  
  // Fallback to first preferred exercise
  return exercises[0] || "breathing";
}

// Handle messages from content scripts, popup, and other components
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  // Track emotion data
  if (msg && msg.type === "TRACK_EMOTION") {
    const record = {
      ts: Date.now(),
      url: sender.tab ? sender.tab.url : null,
      title: sender.tab ? sender.tab.title : null,
      emotion: msg.emotion,
      score: msg.score || null,
      intensity: msg.intensity || "medium",
      keywords: msg.keywords || [],
      suggestion: msg.suggestion || "",
      source: msg.source || "unknown"
    };
    
    chrome.storage.local.get({ emotionHistory: [] }, async (data) => {
      const arr = data.emotionHistory;
      arr.push(record);
      
      // Keep only last 7 days
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const filtered = arr.filter(r => r.ts >= sevenDaysAgo);
      
      chrome.storage.local.set({ emotionHistory: filtered });
      
      // Get recommendation for this emotion
      const cfg = await getConfig();
      const recommendation = getRecommendedExercise(msg.emotion, cfg);
      
      sendResponse({ 
        ok: true, 
        recommendation: recommendation 
      });
    });
    
    return true; // Indicate async response
  }
  
  // Get exercise recommendation
  if (msg && msg.type === "GET_RECOMMENDATION") {
    getConfig().then(cfg => {
      const recommendation = getRecommendedExercise(msg.emotion, cfg);
      sendResponse({ recommendation });
    });
    return true;
  }
  
  // Track exercise completion
  if (msg && msg.type === "TRACK_EXERCISE") {
    const record = {
      ts: Date.now(),
      exercise: msg.exercise,
      duration: msg.duration || null,
      completed: msg.completed || false
    };
    
    chrome.storage.local.get({ exerciseHistory: [] }, (data) => {
      const arr = data.exerciseHistory || [];
      arr.push(record);
      
      // Keep only last 30 days
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filtered = arr.filter(r => r.ts >= thirtyDaysAgo);
      
      chrome.storage.local.set({ exerciseHistory: filtered });
      sendResponse({ ok: true });
    });
    
    return true;
  }
  
  // Get AI availability status
  if (msg && msg.type === "CHECK_AI_STATUS") {
    // This will be checked in the content script context
    sendResponse({ 
      message: "AI status check should be done in content script context" 
    });
    return false;
  }
});

console.log("[Wellness Companion] Background service worker loaded");
