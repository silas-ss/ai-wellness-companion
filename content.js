// content.js
// AI-Powered Content Analysis using Chrome Built-in AI APIs
// Analyzes emotional tone of webpages and provides contextual wellness interventions

(function () {
  "use strict";

  // Helper: extract main visible text from the page
  function extractVisibleText() {
    const body = document.body;
    if (!body) return "";
    
    // Clone body and remove non-content elements
    const clone = body.cloneNode(true);
    const nonContentSelectors = "script, style, noscript, iframe, svg, nav, footer, header.site-header";
    const nonContent = clone.querySelectorAll(nonContentSelectors);
    nonContent.forEach(el => el.remove());
    
    // Get main content if possible
    const mainContent = clone.querySelector("main, article, [role='main'], .content, #content");
    const text = mainContent ? mainContent.innerText : clone.innerText;
    
    return text || "";
  }

  // Analyze page content using Chrome AI
  async function analyzeAndReport() {
    try {
      const text = extractVisibleText().slice(0, 8000); // Limit for API
      
      if (!text || text.length < 100) {
        console.log("[Wellness Companion] Page content too short for analysis");
        return;
      }

      console.log(`[Wellness Companion] Analyzing ${text.length} characters...`);

      // Use Chrome AI to analyze emotion
      const result = await AIService.analyzeEmotion(text);
      
      console.log("[Wellness Companion] Analysis result:", result);

      // Send to background script for tracking
      chrome.runtime.sendMessage({
        type: "TRACK_EMOTION",
        emotion: result.emotion,
        score: result.score,
        intensity: result.intensity,
        keywords: result.keywords,
        suggestion: result.suggestion,
        source: result.source
      }, (response) => {
        if (response && response.recommendation) {
          sessionStorage.setItem("wellness_recommendation", response.recommendation);
        }
      });

      // Get user preferences
      chrome.storage.sync.get({
        sensitivity: "medium",
        enabledNotifications: true,
        trackEmotions: {
          positive: true,
          negative: true,
          anxiety: true,
          anger: true,
          neutral: true
        }
      }, (config) => {
        // Check if this emotion should trigger intervention
        if (!config.trackEmotions[result.emotion] || !config.enabledNotifications) {
          return;
        }

        // Determine threshold based on sensitivity
        const thresholds = {
          low: 0.015,
          medium: 0.010,
          high: 0.005
        };
        
        const threshold = thresholds[config.sensitivity] || thresholds.medium;

        // Show intervention for negative emotions
        if (["anxiety", "anger", "negative"].includes(result.emotion) && 
            result.score >= threshold) {
          showWellnessBanner(result);
        }
      });

    } catch (error) {
      console.error("[Wellness Companion] Analysis error:", error);
    }
  }

  // Show wellness intervention banner with AI-powered suggestions
  function showWellnessBanner(analysisResult) {
    // Don't show duplicate banners
    if (document.getElementById("ai-wellness-banner")) return;

    const { emotion, intensity, suggestion, source } = analysisResult;

    const emotionMessages = {
      anxiety: "Feeling stressed? Your well-being matters.",
      anger: "Feeling tense? Let's find some calm.",
      negative: "Feeling down? A moment of care can help."
    };

    const message = emotionMessages[emotion] || "Take a wellness break?";
    const aiPowered = source === "chrome-ai" ? "✨ AI-powered insight" : "";

    const banner = document.createElement("div");
    banner.id = "ai-wellness-banner";
    banner.setAttribute("role", "alert");
    banner.setAttribute("aria-live", "polite");
    banner.setAttribute("aria-label", "Wellness intervention suggestion");
    
    Object.assign(banner.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      zIndex: "2147483647",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      boxShadow: "0 10px 40px rgba(102, 126, 234, 0.4)",
      borderRadius: "16px",
      padding: "20px 24px",
      fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      color: "#fff",
      maxWidth: "380px",
      animation: "slideInBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
      backdropFilter: "blur(10px)"
    });

    // Inject animation keyframes
    if (!document.getElementById("wellness-banner-styles")) {
      const style = document.createElement("style");
      style.id = "wellness-banner-styles";
      style.textContent = `
        @keyframes slideInBanner {
          from {
            transform: translateY(120px) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        @keyframes slideOutBanner {
          from {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          to {
            transform: translateY(120px) scale(0.9);
            opacity: 0;
          }
        }
        #ai-wellness-banner button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        #ai-wellness-banner button:active {
          transform: translateY(0);
        }
      `;
      document.head.appendChild(style);
    }

    banner.innerHTML = `
      <div style="display:flex; gap:12px; align-items:flex-start; margin-bottom:12px;">
        <div style="font-size:28px; line-height:1;">🧘</div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:15px; margin-bottom:4px;">${message}</div>
          <div style="font-size:13px; opacity:0.95; line-height:1.5;">${suggestion || "Take a moment to practice self-care."}</div>
          ${aiPowered ? `<div style="font-size:11px; opacity:0.7; margin-top:6px;">${aiPowered}</div>` : ""}
        </div>
      </div>
      <div style="display:flex; gap:10px;">
        <button id="ai-wellness-take-break" 
                style="flex:1; padding:10px 16px; border-radius:10px; border:none; background:rgba(255,255,255,0.95); color:#667eea; font-weight:600; cursor:pointer; font-size:14px; transition: all 0.2s;"
                aria-label="Start wellness exercise">
          Start Exercise
        </button>
        <button id="ai-wellness-dismiss" 
                style="padding:10px 14px; border-radius:10px; border:none; background:rgba(255,255,255,0.15); color:#fff; cursor:pointer; font-size:14px; transition: all 0.2s;"
                aria-label="Dismiss wellness reminder">
          ✕
        </button>
      </div>
    `;

    document.body.appendChild(banner);

    // Get recommended exercise based on emotion
    const recommendation = sessionStorage.getItem("wellness_recommendation") || 
                          AIService.getRecommendedExercise(emotion);

    // Event handlers
    document.getElementById("ai-wellness-take-break").addEventListener("click", () => {
      const exerciseUrl = chrome.runtime.getURL(`exercises/${recommendation}.html`);
      window.open(exerciseUrl, "_blank");
      dismissBanner();
    });

    document.getElementById("ai-wellness-dismiss").addEventListener("click", dismissBanner);

    // Auto-dismiss after 12 seconds
    setTimeout(() => {
      if (banner.parentNode) {
        dismissBanner();
      }
    }, 12000);

    function dismissBanner() {
      banner.style.animation = "slideOutBanner 0.3s cubic-bezier(0.16, 1, 0.3, 1)";
      setTimeout(() => banner.remove(), 300);
    }
  }

  // Initialize AI service
  async function initialize() {
    console.log("[Wellness Companion] Initializing...");
    
    // Check AI availability
    const aiStatus = await AIService.checkAIAvailability();
    console.log("[Wellness Companion] AI Status:", aiStatus);

    // Initialize AI models
    if (aiStatus.languageModel) {
      await AIService.initLanguageModel();
      console.log("[Wellness Companion] Chrome AI Language Model ready");
    } else {
      console.warn("[Wellness Companion] Chrome AI not available, using fallback analysis");
    }

    if (aiStatus.summarizer) {
      await AIService.initSummarizer();
      console.log("[Wellness Companion] Chrome AI Summarizer ready");
    }
  }

  // Run analysis after page loads
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initialize().then(() => {
        setTimeout(analyzeAndReport, 2500);
      });
    });
  } else {
    initialize().then(() => {
      setTimeout(analyzeAndReport, 2500);
    });
  }

  // Monitor for navigation changes (SPAs)
  let lastUrl = location.href;
  const urlObserver = new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      
      // Remove old banner if exists
      const oldBanner = document.getElementById("ai-wellness-banner");
      if (oldBanner) oldBanner.remove();
      
      // Analyze new page
      setTimeout(analyzeAndReport, 2500);
    }
  });

  urlObserver.observe(document, { subtree: true, childList: true });

  console.log("[Wellness Companion] Content script loaded");

})();
