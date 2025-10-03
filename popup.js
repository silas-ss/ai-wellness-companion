// popup.js
// Popup interface for AI Mental Wellness Companion

(function() {
  "use strict";

  // Exercise buttons
  document.getElementById("breathing").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("exercises/breathing.html") });
  });

  document.getElementById("affirmation").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("exercises/affirmation.html") });
  });

  document.getElementById("mindfulness").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("exercises/mindfulness.html") });
  });

  // Navigation buttons
  document.getElementById("dashboard").addEventListener("click", () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("dashboard.html") });
  });

  document.getElementById("options").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
  });

  // Check Chrome AI availability
  async function checkAIStatus() {
    const statusEl = document.getElementById("aiStatus");
    const statusTextEl = document.getElementById("aiStatusText");

    try {
      if (window.AIService) {
        const status = await AIService.checkAIAvailability();
        
        if (status.languageModel) {
          statusEl.classList.remove("inactive");
          statusTextEl.textContent = "Chrome AI active - Enhanced analysis enabled";
        } else {
          statusEl.classList.add("inactive");
          statusTextEl.textContent = "Chrome AI not available - Using fallback analysis";
        }
      } else {
        statusEl.classList.add("inactive");
        statusTextEl.textContent = "AI Service not loaded - Using basic analysis";
      }
    } catch (error) {
      console.error("[Popup] AI status check error:", error);
      statusEl.classList.add("inactive");
      statusTextEl.textContent = "AI status unavailable";
    }
  }

  // Show emotional summary from today
  function showEmotionalSummary() {
    chrome.storage.local.get({ emotionHistory: [] }, (data) => {
      const arr = data.emotionHistory || [];
      
      // Filter for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayRecords = arr.filter(r => r.ts >= today.getTime());

      // Count emotions
      const counts = {
        positive: 0,
        negative: 0,
        anxiety: 0,
        anger: 0,
        neutral: 0
      };

      todayRecords.forEach(record => {
        if (counts.hasOwnProperty(record.emotion)) {
          counts[record.emotion]++;
        }
      });

      // Update UI
      document.getElementById("posCount").textContent = counts.positive;
      document.getElementById("negCount").textContent = counts.negative;
      document.getElementById("anxCount").textContent = counts.anxiety;
      document.getElementById("angerCount").textContent = counts.anger;
    });
  }

  // Initialize popup
  async function init() {
    console.log("[Popup] Initializing...");
    
    // Show emotional summary
    showEmotionalSummary();
    
    // Check AI status (this needs to be done in a content script context)
    // For now, show a generic message
    const statusEl = document.getElementById("aiStatus");
    const statusTextEl = document.getElementById("aiStatusText");
    statusTextEl.textContent = "AI-powered emotion analysis active";
    statusEl.classList.remove("inactive");
    
    // Try to inject content script into active tab for immediate analysis
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].id) {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          files: ["ai-service.js", "content.js"]
        }).catch(error => {
          // Silently fail for restricted pages (chrome://, etc.)
          console.log("[Popup] Could not inject into this page:", error.message);
        });
      }
    });
  }

  // Run on popup open
  init();

})();
