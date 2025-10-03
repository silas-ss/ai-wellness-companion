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
   * Initialize Translator for multi-language support
   */
  async function initTranslator() {
    try {
      if (!self.ai || !self.ai.translator) {
        console.warn("[AI Service] Chrome AI Translator not available");
        return null;
      }

      const capabilities = await self.ai.translator.capabilities();

      if (capabilities.available === "no") {
        console.warn("[AI Service] Translator not available");
        return null;
      }

      translatorSession = await self.ai.translator.create({
        sourceLanguage: "auto",
        targetLanguage: "en"
      });

      return translatorSession;
    } catch (error) {
      console.error("[AI Service] Failed to initialize Translator:", error);
      return null;
    }
  }

  /**
   * Detect if text is in English or needs translation
   * @param {string} text - Text to check
   * @returns {Promise<boolean>} True if text is likely English
   */
  async function isEnglishText(text) {
    try {
      // Simple heuristic: check for common non-English characters and patterns
      const englishPatterns = /^[a-zA-Z\s\-\.,!?;:()"'0-9]+$/;

      // If text contains mostly ASCII characters, it's likely English
      const asciiRatio = [...text].filter(char => char.charCodeAt(0) < 128).length / text.length;

      if (asciiRatio > 0.9) {
        return true;
      }

      // Use language model to detect language if available
      if (languageModelSession) {
        const detectionPrompt = `What language is this text written in? Respond with ONLY the language name in English (e.g., "English", "Spanish", "French", etc.): "${text.slice(0, 200)}"`;
        const response = await languageModelSession.prompt(detectionPrompt);
        const detectedLanguage = response.trim().toLowerCase();

        console.log("[AI Service] Detected language:", detectedLanguage);
        return detectedLanguage.includes("english") || detectedLanguage === "en";
      }

      // Fallback: if we can't determine, assume it's not English if it has non-ASCII chars
      return asciiRatio > 0.8;

    } catch (error) {
      console.warn("[AI Service] Language detection error:", error);
      // Default to assuming it's English if detection fails
      return true;
    }
  }

  /**
   * Translate text to English for analysis using Chrome AI Translation API
   * NOTE: Translation API is in Early Preview Program (EPP) only - not publicly available yet
   * Falls back to original text which works with multilingual heuristic analysis
   * 
   * @param {string} text - Text to translate
   * @returns {Promise<string>} Translated text (if API available) or original text (for multilingual fallback)
   */
  async function translateForAnalysis(text) {
    try {
      // Check if text is already in English (quick heuristic check)
      const isEnglish = await isEnglishText(text);
      if (isEnglish) {
        console.log("[AI Service] ✅ Text detected as English, no translation needed");
        return text;
      }

      console.log("[AI Service] 🌍 Non-English text detected, attempting translation...");

      // Initialize translator if needed (will fail gracefully if not in EPP)
      if (!translatorSession) {
        await initTranslator();
      }

      // If translator is available (EPP users), use it
      if (translatorSession) {
        console.log("[AI Service] 🚀 Using Chrome AI Translation API...");
        
        const translatedText = await translatorSession.translate(text);
        
        if (translatedText && translatedText !== text) {
          console.log("[AI Service] ✅ Translation completed successfully!");
          return translatedText;
        }
      }

      // Translator not available or translation failed
      // Use original text with multilingual fallback analysis
      console.info("[AI Service] ℹ️ Translation API not available - Using multilingual analysis (supports 5+ languages)");
      return text;

    } catch (error) {
      console.info("[AI Service] ℹ️ Translation not available:", error.message);
      console.info("[AI Service] 🌍 Using multilingual heuristic analysis instead");
      return text; // Original text will be analyzed with multilingual keywords
    }
  }

  /**
   * Analyze emotional tone of text using Chrome AI
   * Automatically handles multi-language content by translating to English for analysis
   * @param {string} text - Text to analyze (any language)
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

      // Translate text to English for analysis (internal only, user doesn't see this)
      const textForAnalysis = await translateForAnalysis(text);

      // Limit text length for API
      const truncatedText = textForAnalysis.slice(0, 5000);

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
   * Multilingual emotion analysis fallback
   * Supports English, Portuguese, Spanish, French, German, and more
   * Used when Chrome AI Translation is not available
   */
  function fallbackEmotionAnalysis(text) {
    // Expanded multilingual emotion keywords
    const emotionKeywords = {
      positive: [
        // English
        "happy", "joy", "wonderful", "great", "positive", "optimistic", "celebrate", "excited", "love", "beautiful", "amazing", "excellent", "fantastic", "cheerful", "delighted", "pleased",
        // Portuguese
        "feliz", "alegria", "maravilhoso", "ótimo", "positivo", "otimista", "celebrar", "animado", "amor", "lindo", "incrível", "excelente", "fantástico",
        // Spanish
        "feliz", "alegría", "maravilloso", "genial", "positivo", "optimista", "celebrar", "emocionado", "amor", "hermoso", "increíble", "excelente", "fantástico",
        // French
        "heureux", "joie", "merveilleux", "génial", "positif", "optimiste", "célébrer", "excité", "amour", "beau", "incroyable", "excellent", "fantastique",
        // German
        "glücklich", "freude", "wunderbar", "großartig", "positiv", "optimistisch", "feiern", "aufgeregt", "liebe", "schön", "erstaunlich", "ausgezeichnet"
      ],
      negative: [
        // English
        "sad", "terrible", "worst", "awful", "horrible", "bad", "unfortunate", "disappointing", "depressing", "tragic", "miserable", "unhappy", "sorrow", "pain", "hurt",
        // Portuguese
        "triste", "terrível", "pior", "horrível", "ruim", "infeliz", "decepcionante", "deprimente", "trágico", "miserável", "dor", "sofrimento",
        // Spanish
        "triste", "terrible", "peor", "horrible", "malo", "desafortunado", "decepcionante", "deprimente", "trágico", "miserable", "dolor", "sufrimiento",
        // French
        "triste", "terrible", "pire", "horrible", "mauvais", "malheureux", "décevant", "déprimant", "tragique", "misérable", "douleur",
        // German
        "traurig", "schrecklich", "schlimmste", "furchtbar", "schlecht", "unglücklich", "enttäuschend", "deprimierend", "tragisch", "elend", "schmerz"
      ],
      anxiety: [
        // English
        "anxious", "panic", "worry", "nervous", "stress", "stressed", "overwhelmed", "fear", "scared", "afraid", "uncertain", "tension", "pressure", "worried", "concern",
        // Portuguese
        "ansioso", "pânico", "preocupado", "nervoso", "estresse", "estressado", "sobrecarregado", "medo", "assustado", "receio", "incerto", "tensão", "pressão",
        // Spanish
        "ansioso", "pánico", "preocupado", "nervioso", "estrés", "estresado", "abrumado", "miedo", "asustado", "temeroso", "incierto", "tensión", "presión",
        // French
        "anxieux", "panique", "inquiet", "nerveux", "stress", "stressé", "débordé", "peur", "effrayé", "craintif", "incertain", "tension", "pression",
        // German
        "ängstlich", "panik", "besorgt", "nervös", "stress", "gestresst", "überfordert", "angst", "erschrocken", "unsicher", "spannung", "druck"
      ],
      anger: [
        // English
        "angry", "outrage", "furious", "irate", "rage", "hate", "attack", "violence", "fight", "hostile", "aggressive", "frustrated", "annoyed", "irritated", "mad",
        // Portuguese
        "raiva", "furioso", "irritado", "ódio", "ataque", "violência", "luta", "hostil", "agressivo", "frustrado", "chateado", "bravo",
        // Spanish
        "enojado", "furia", "furioso", "odio", "ataque", "violencia", "pelea", "hostil", "agresivo", "frustrado", "molesto", "irritado",
        // French
        "en colère", "furieux", "rage", "haine", "attaque", "violence", "combat", "hostile", "agressif", "frustré", "agacé", "irrité",
        // German
        "wütend", "zorn", "wut", "hass", "angriff", "gewalt", "kampf", "feindselig", "aggressiv", "frustriert", "verärgert", "gereizt"
      ]
    };

    const lowerText = text.toLowerCase();
    const words = lowerText.split(/\s+/);
    const counts = { positive: 0, negative: 0, anxiety: 0, anger: 0 };

    // Count keyword matches across all languages
    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      keywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, "gi");
        const matches = lowerText.match(regex);
        if (matches) counts[emotion] += matches.length;
      });
    }

    const totalMatches = Object.values(counts).reduce((a, b) => a + b, 0);
    
    if (totalMatches === 0) {
      return { emotion: "neutral", score: 0, intensity: "low", keywords: [], suggestion: "", source: "multilingual-heuristic" };
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
      source: "multilingual-heuristic" 
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

