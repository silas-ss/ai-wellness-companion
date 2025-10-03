// ai-service.js
// Chrome Built-in AI Service Layer for Mental Wellness Companion
// Uses chrome.ai.languageModel, chrome.ai.summarizer, and chrome.ai.translator

/**
 * AI Service Manager
 * Handles all Chrome Built-in AI API interactions
 */
const AIService = (() => {
  "use strict";

  // AI session caches
  let languageModelSession = null;
  let summarizerSession = null;
  let translatorSession = null;

  /**
   * Initialize Language Model for emotion analysis
   */
  async function initLanguageModel() {
    try {
      if (!self.ai || !self.ai.languageModel) {
        console.warn("[AI Service] Chrome AI Language Model not available");
        return null;
      }

      const capabilities = await self.ai.languageModel.capabilities();
      
      if (capabilities.available === "no") {
        console.warn("[AI Service] Language Model not available");
        return null;
      }

      // Create session for emotion analysis
      languageModelSession = await self.ai.languageModel.create({
        systemPrompt: `You are an emotion analysis AI. Analyze text and respond ONLY with a JSON object in this exact format:
{
  "emotion": "one of: positive, negative, anxiety, anger, neutral",
  "score": number between 0 and 1,
  "intensity": "low, medium, or high",
  "keywords": ["key", "words"],
  "suggestion": "brief wellness tip"
}
Be concise and accurate. Always return valid JSON only.`
      });

      return languageModelSession;
    } catch (error) {
      console.error("[AI Service] Failed to initialize Language Model:", error);
      return null;
    }
  }

  /**
   * Initialize Summarizer for content simplification
   */
  async function initSummarizer() {
    try {
      if (!self.ai || !self.ai.summarizer) {
        console.warn("[AI Service] Chrome AI Summarizer not available");
        return null;
      }

      const capabilities = await self.ai.summarizer.capabilities();
      
      if (capabilities.available === "no") {
        console.warn("[AI Service] Summarizer not available");
        return null;
      }

      summarizerSession = await self.ai.summarizer.create({
        type: "tl;dr",
        format: "plain-text",
        length: "short"
      });

      return summarizerSession;
    } catch (error) {
      console.error("[AI Service] Failed to initialize Summarizer:", error);
      return null;
    }
  }

  /**
   * Analyze emotional tone of text using Chrome AI
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Emotion analysis result
   */
  async function analyzeEmotion(text) {
    try {
      // Ensure we have a language model session
      if (!languageModelSession) {
        await initLanguageModel();
      }

      if (!languageModelSession) {
        // Fallback to heuristic analysis
        return fallbackEmotionAnalysis(text);
      }

      // Limit text length for API
      const truncatedText = text.slice(0, 5000);

      // Create prompt for emotion analysis
      const prompt = `Analyze the emotional tone of this text and respond with JSON only:\n\n"${truncatedText}"`;

      // Get AI response
      const response = await languageModelSession.prompt(prompt);
      
      // Parse JSON response
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const result = JSON.parse(jsonMatch[0]);
          
          // Validate result structure
          if (result.emotion && typeof result.score === "number") {
            return {
              emotion: result.emotion,
              score: Math.min(Math.max(result.score, 0), 1),
              intensity: result.intensity || "medium",
              keywords: result.keywords || [],
              suggestion: result.suggestion || "",
              source: "chrome-ai"
            };
          }
        }
      } catch (parseError) {
        console.warn("[AI Service] Failed to parse AI response:", parseError);
      }

      // Fallback if parsing fails
      return fallbackEmotionAnalysis(text);

    } catch (error) {
      console.error("[AI Service] Emotion analysis error:", error);
      return fallbackEmotionAnalysis(text);
    }
  }

  /**
   * Fallback heuristic emotion analysis
   * Used when Chrome AI is not available
   */
  function fallbackEmotionAnalysis(text) {
    const emotionKeywords = {
      positive: ["happy", "joy", "wonderful", "great", "positive", "optimistic", "celebrate", "excited", "love", "beautiful", "amazing", "excellent", "fantastic"],
      negative: ["sad", "terrible", "worst", "awful", "horrible", "bad", "unfortunate", "disappointing", "depressing", "tragic", "miserable", "unhappy"],
      anxiety: ["anxious", "panic", "worry", "nervous", "stress", "stressed", "overwhelmed", "fear", "scared", "afraid", "uncertain", "tension", "pressure"],
      anger: ["angry", "outrage", "furious", "irate", "rage", "hate", "attack", "violence", "fight", "hostile", "aggressive", "frustrated"]
    };

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    const counts = { positive: 0, negative: 0, anxiety: 0, anger: 0 };

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        const matches = lowerText.match(regex);
        if (matches) counts[emotion] += matches.length;
      });
    }

    const totalMatches = Object.values(counts).reduce((a, b) => a + b, 0);
    
    if (totalMatches === 0) {
      return { emotion: "neutral", score: 0, intensity: "low", keywords: [], suggestion: "", source: "heuristic" };
    }

    let dominant = "neutral";
    let maxCount = 0;
    
    for (const [emotion, count] of Object.entries(counts)) {
      if (count > maxCount) {
        maxCount = count;
        dominant = emotion;
      }
    }

    const score = maxCount / words.length;
    const intensity = score > 0.02 ? "high" : score > 0.01 ? "medium" : "low";

    return { 
      emotion: dominant, 
      score, 
      intensity,
      keywords: [],
      suggestion: "",
      source: "heuristic" 
    };
  }

  /**
   * Summarize emotionally heavy content into neutral text
   * @param {string} text - Text to summarize
   * @returns {Promise<string>} Summarized text
   */
  async function summarizeContent(text) {
    try {
      if (!summarizerSession) {
        await initSummarizer();
      }

      if (!summarizerSession) {
        return "Summary not available. Chrome AI Summarizer is not enabled.";
      }

      const summary = await summarizerSession.summarize(text);
      return summary || text.slice(0, 500) + "...";

    } catch (error) {
      console.error("[AI Service] Summarization error:", error);
      return text.slice(0, 500) + "...";
    }
  }

  /**
   * Generate personalized affirmation using AI
   * @param {string} emotion - Current emotion
   * @returns {Promise<string>} Personalized affirmation
   */
  async function generateAffirmation(emotion) {
    try {
      if (!languageModelSession) {
        await initLanguageModel();
      }

      if (!languageModelSession) {
        return getFallbackAffirmation(emotion);
      }

      const prompt = `Generate a single short, positive, personal affirmation (max 15 words) for someone feeling ${emotion}. Respond with ONLY the affirmation text, no quotes or extra formatting.`;

      const affirmation = await languageModelSession.prompt(prompt);
      return affirmation.trim().replace(/^["']|["']$/g, '') || getFallbackAffirmation(emotion);

    } catch (error) {
      console.error("[AI Service] Affirmation generation error:", error);
      return getFallbackAffirmation(emotion);
    }
  }

  /**
   * Fallback affirmations
   */
  function getFallbackAffirmation(emotion) {
    const affirmations = {
      anxiety: "I am calm and in control. I breathe deeply and release tension.",
      anger: "I choose peace over frustration. I release what I cannot control.",
      negative: "I am resilient and capable. Better moments are coming.",
      positive: "I embrace this positive energy and share it with the world.",
      neutral: "I am present and aware. I appreciate this moment."
    };
    return affirmations[emotion] || affirmations.neutral;
  }

  /**
   * Generate mindfulness tip using AI
   * @param {string} emotion - Current emotion
   * @returns {Promise<string>} Mindfulness tip
   */
  async function generateMindfulnessTip(emotion) {
    try {
      if (!languageModelSession) {
        await initLanguageModel();
      }

      if (!languageModelSession) {
        return getFallbackMindfulnessTip(emotion);
      }

      const prompt = `Generate a brief mindfulness tip (max 25 words) for someone feeling ${emotion}. Focus on practical, immediate actions. Respond with ONLY the tip, no quotes.`;

      const tip = await languageModelSession.prompt(prompt);
      return tip.trim().replace(/^["']|["']$/g, '') || getFallbackMindfulnessTip(emotion);

    } catch (error) {
      console.error("[AI Service] Mindfulness tip generation error:", error);
      return getFallbackMindfulnessTip(emotion);
    }
  }

  /**
   * Fallback mindfulness tips
   */
  function getFallbackMindfulnessTip(emotion) {
    const tips = {
      anxiety: "Focus on your breath. Notice 5 things you can see, 4 you can touch, 3 you can hear.",
      anger: "Pause before reacting. Count to 10 slowly. Notice where you feel tension in your body.",
      negative: "Acknowledge your feelings without judgment. They are temporary and will pass.",
      positive: "Savor this feeling. Take a moment to appreciate what brought you joy.",
      neutral: "Be present. Notice your surroundings with curiosity and openness."
    };
    return tips[emotion] || tips.neutral;
  }

  /**
   * Get AI recommendation for best exercise based on emotion
   * @param {string} emotion - Current emotion
   * @param {Object} preferences - User exercise preferences
   * @returns {string} Recommended exercise
   */
  function getRecommendedExercise(emotion, preferences = {}) {
    const recommendations = {
      anxiety: ["breathing", "mindfulness"],
      anger: ["breathing", "mindfulness"],
      negative: ["affirmation", "mindfulness"],
      positive: ["affirmation"],
      neutral: ["breathing", "affirmation", "mindfulness"]
    };

    const suggested = recommendations[emotion] || recommendations.neutral;
    
    // Filter by user preferences
    const availableExercises = suggested.filter(ex => 
      !preferences.preferredExercises || preferences.preferredExercises[ex] !== false
    );

    return availableExercises[0] || "breathing";
  }

  /**
   * Check AI availability status
   */
  async function checkAIAvailability() {
    const status = {
      languageModel: false,
      summarizer: false,
      translator: false
    };

    try {
      if (self.ai?.languageModel) {
        const caps = await self.ai.languageModel.capabilities();
        status.languageModel = caps.available !== "no";
      }
    } catch (e) {
      // Silently fail
    }

    try {
      if (self.ai?.summarizer) {
        const caps = await self.ai.summarizer.capabilities();
        status.summarizer = caps.available !== "no";
      }
    } catch (e) {
      // Silently fail
    }

    try {
      if (self.ai?.translator) {
        const caps = await self.ai.translator.capabilities();
        status.translator = caps.available !== "no";
      }
    } catch (e) {
      // Silently fail
    }

    return status;
  }

  // Public API
  return {
    analyzeEmotion,
    summarizeContent,
    generateAffirmation,
    generateMindfulnessTip,
    getRecommendedExercise,
    checkAIAvailability,
    initLanguageModel,
    initSummarizer
  };
})();

// Make available globally
if (typeof window !== 'undefined') {
  window.AIService = AIService;
}

