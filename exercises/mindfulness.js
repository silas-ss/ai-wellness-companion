// mindfulness.js
// AI-powered mindfulness tips generator using Chrome Built-in AI

(function() {
  "use strict";

  const tipText = document.getElementById("tipText");
  const tipCategory = document.getElementById("tipCategory");
  const newTipBtn = document.getElementById("newTip");
  const closeBtn = document.getElementById("close");
  const loading = document.getElementById("loading");
  const aiBadge = document.getElementById("aiBadge");

  let currentEmotion = "neutral";
  let tipsShown = 0;

  // Curated mindfulness tips by emotion
  const mindfulnessTips = {
    anxiety: [
      {
        category: "Grounding Technique",
        tip: "Notice 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings you back to the present."
      },
      {
        category: "Body Scan",
        tip: "Slowly scan your body from head to toe. Notice any tension and imagine it melting away with each exhale."
      },
      {
        category: "Breath Awareness",
        tip: "Place your hand on your belly. Feel it rise with each inhale and fall with each exhale. This is your anchor to calm."
      }
    ],
    anger: [
      {
        category: "Pause and Observe",
        tip: "Before reacting, pause. Count to 10 slowly. Notice where you feel tension in your body. Breathe into that space."
      },
      {
        category: "Compassion Practice",
        tip: "Ask yourself: 'What does this person/situation need right now?' Shift from judgment to curiosity."
      },
      {
        category: "Release Tension",
        tip: "Clench your fists tightly, hold for 5 seconds, then release. Notice the difference between tension and relaxation."
      }
    ],
    negative: [
      {
        category: "Gratitude Moment",
        tip: "Name three small things you're grateful for right now. They can be as simple as a warm drink or a comfortable seat."
      },
      {
        category: "Self-Compassion",
        tip: "Speak to yourself as you would to a dear friend. Acknowledge your feelings without judgment. You are doing your best."
      },
      {
        category: "Present Moment",
        tip: "This feeling is temporary. Notice one pleasant sensation in this moment—a gentle breeze, soft fabric, or warm light."
      }
    ],
    positive: [
      {
        category: "Savoring Practice",
        tip: "Fully immerse yourself in this positive feeling. Notice how it feels in your body. Breathe it in deeply."
      },
      {
        category: "Appreciation",
        tip: "Take a moment to appreciate what brought you this joy. Can you share this positive energy with someone today?"
      },
      {
        category: "Mindful Joy",
        tip: "Notice the small details of this moment. The colors, sounds, and sensations. This is life fully experienced."
      }
    ],
    neutral: [
      {
        category: "Present Awareness",
        tip: "Simply notice what is. Your breath, your posture, the sounds around you. No need to change anything—just observe."
      },
      {
        category: "Sensory Check-in",
        tip: "Tune into your five senses one by one. What are you seeing, hearing, feeling, smelling, and tasting right now?"
      },
      {
        category: "Mindful Breathing",
        tip: "Follow your breath like ocean waves. In and out, rise and fall. Each breath is a new beginning."
      }
    ]
  };

  // Get random tip from curated collection
  function getRandomTip(emotion) {
    const tips = mindfulnessTips[emotion] || mindfulnessTips.neutral;
    return tips[Math.floor(Math.random() * tips.length)];
  }

  // Get user's recent emotional state
  async function getRecentEmotion() {
    return new Promise((resolve) => {
      chrome.storage.local.get({ emotionHistory: [] }, (data) => {
        const recent = data.emotionHistory.slice(-5);
        if (recent.length === 0) {
          resolve("neutral");
          return;
        }

        // Find most common emotion
        const counts = {};
        recent.forEach(r => {
          counts[r.emotion] = (counts[r.emotion] || 0) + 1;
        });

        let maxEmotion = "neutral";
        let maxCount = 0;
        for (const [emotion, count] of Object.entries(counts)) {
          if (count > maxCount) {
            maxCount = count;
            maxEmotion = emotion;
          }
        }

        resolve(maxEmotion);
      });
    });
  }

  // Generate mindfulness tip using Chrome AI
  async function generateTip() {
    try {
      loading.classList.add("active");
      newTipBtn.disabled = true;

      // Get user's recent emotional state
      currentEmotion = await getRecentEmotion();
      console.log("[Mindfulness] Generating tip for emotion:", currentEmotion);

      // Try to use Chrome AI
      let tipContent = null;
      let isAI = false;

      if (window.AIService) {
        tipContent = await AIService.generateMindfulnessTip(currentEmotion);
        
        if (tipContent && tipContent.length > 15) {
          isAI = true;
          displayTip("Mindful Insight", tipContent, isAI);
          return;
        }
      }

      // Fallback to curated tips
      const curated = getRandomTip(currentEmotion);
      displayTip(curated.category, curated.tip, false);

    } catch (error) {
      console.error("[Mindfulness] Generation error:", error);
      const curated = getRandomTip(currentEmotion);
      displayTip(curated.category, curated.tip, false);
    } finally {
      loading.classList.remove("active");
      newTipBtn.disabled = false;
    }
  }

  // Display tip with animation
  function displayTip(category, tip, isAI) {
    // Fade out
    tipText.style.opacity = "0";
    tipCategory.style.opacity = "0";
    tipText.style.transform = "translateY(-10px)";
    tipCategory.style.transform = "translateY(-10px)";

    setTimeout(() => {
      tipCategory.textContent = category;
      tipText.textContent = tip;
      tipsShown++;

      // Show AI badge if generated by AI
      if (isAI) {
        aiBadge.style.display = "inline-block";
      } else {
        aiBadge.style.display = "none";
      }

      // Fade in
      tipText.style.transition = "all 0.5s ease";
      tipCategory.style.transition = "all 0.5s ease";
      tipText.style.opacity = "1";
      tipCategory.style.opacity = "1";
      tipText.style.transform = "translateY(0)";
      tipCategory.style.transform = "translateY(0)";
    }, 300);
  }

  // Track exercise activity
  function trackExercise(completed) {
    chrome.runtime.sendMessage({
      type: "TRACK_EXERCISE",
      exercise: "mindfulness",
      completed: completed,
      duration: null
    });
  }

  // Event listeners
  newTipBtn.addEventListener("click", generateTip);

  closeBtn.addEventListener("click", () => {
    trackExercise(tipsShown >= 2); // Consider completed if viewed 2+ tips
    window.close();
  });

  // Keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (!newTipBtn.disabled) {
        generateTip();
      }
    } else if (e.key === "Escape") {
      closeBtn.click();
    }
  });

  // Initialize
  (async function init() {
    console.log("[Mindfulness] Exercise initialized");
    
    // Load user's emotion and show appropriate first tip
    currentEmotion = await getRecentEmotion();
    const firstTip = getRandomTip(currentEmotion);
    tipCategory.textContent = firstTip.category;
    tipText.textContent = firstTip.tip;
    tipsShown = 1;

    // Track that exercise was started
    trackExercise(false);
  })();

})();

