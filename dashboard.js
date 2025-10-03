// dashboard.js
// Dashboard for AI Mental Wellness Companion

(function() {
  "use strict";

  let currentPeriod = "today";

  const emotionConfig = {
    positive: { color: "#22c55e", icon: "😊", label: "Positive" },
    negative: { color: "#ef4444", icon: "😔", label: "Negative" },
    anxiety: { color: "#f59e0b", icon: "😰", label: "Anxiety" },
    anger: { color: "#dc2626", icon: "😠", label: "Anger" },
    neutral: { color: "#94a3b8", icon: "😐", label: "Neutral" }
  };

  // Get date range based on period
  function getDateRange(period) {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    switch (period) {
      case "today":
        return today.getTime();
      case "week":
        return now - (7 * 24 * 60 * 60 * 1000);
      case "month":
        return now - (30 * 24 * 60 * 60 * 1000);
      default:
        return today.getTime();
    }
  }

  // Render bar chart
  function renderChart(counts) {
    const chartEl = document.getElementById("emotionChart");
    chartEl.innerHTML = "";

    const total = Object.values(counts).reduce((a, b) => a + b, 0);

    if (total === 0) {
      chartEl.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">📊</div>
          <div class="empty-state-text">No emotion data for this period yet.</div>
        </div>
      `;
      return;
    }

    // Sort by count (highest first)
    const sortedEmotions = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .filter(([, count]) => count > 0);

    sortedEmotions.forEach(([emotion, count]) => {
      const config = emotionConfig[emotion] || emotionConfig.neutral;
      const percentage = Math.round((count / total) * 100);

      const row = document.createElement("div");
      row.className = "emotion-bar-row";
      
      row.innerHTML = `
        <div class="emotion-label">
          <span class="emotion-badge" style="background: ${config.color};"></span>
          <span>${config.label}</span>
        </div>
        <div class="bar-container">
          <div class="bar-fill" style="width: ${percentage}%; background: ${config.color};">
            ${count} (${percentage}%)
          </div>
        </div>
      `;

      chartEl.appendChild(row);
    });
  }

  // Update statistics
  function updateStats(emotionData, exerciseData) {
    const emotionTotal = emotionData.length;
    const posCount = emotionData.filter(e => e.emotion === "positive").length;
    const anxCount = emotionData.filter(e => e.emotion === "anxiety").length;
    const exerciseTotal = exerciseData.filter(e => e.completed).length;

    document.getElementById("totalCaptures").textContent = emotionTotal;
    document.getElementById("totalPositive").textContent = posCount;
    document.getElementById("totalAnxiety").textContent = anxCount;
    document.getElementById("totalExercises").textContent = exerciseTotal;
  }

  // Generate insights based on data
  function generateInsights(emotionData, exerciseData) {
    const insightsContainer = document.getElementById("insightsContainer");
    insightsContainer.innerHTML = "";

    if (emotionData.length < 5) {
      insightsContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">🔍</div>
          <div class="empty-state-text">Not enough data yet. Browse the web and your wellness companion will provide insights.</div>
        </div>
      `;
      return;
    }

    const insights = [];

    // Count emotions
    const counts = emotionData.reduce((acc, r) => {
      acc[r.emotion] = (acc[r.emotion] || 0) + 1;
      return acc;
    }, {});

    const total = emotionData.length;
    const negativeCount = (counts.negative || 0) + (counts.anxiety || 0) + (counts.anger || 0);
    const positiveCount = counts.positive || 0;

    // Insight 1: Overall mood
    if (positiveCount > total * 0.5) {
      insights.push("You've been exposed to mostly positive content. Great job curating your digital environment!");
    } else if (negativeCount > total * 0.5) {
      insights.push("You've encountered significant negative or stressful content. Consider taking breaks or using wellness exercises more frequently.");
    } else {
      insights.push("Your emotional exposure is balanced. Keep monitoring your wellbeing as you browse.");
    }

    // Insight 2: Anxiety levels
    if ((counts.anxiety || 0) > total * 0.3) {
      insights.push("High anxiety detection. Try the breathing exercise to help manage stress levels.");
    }

    // Insight 3: Exercise completion
    const completedExercises = exerciseData.filter(e => e.completed).length;
    if (completedExercises > 5) {
      insights.push(`Great commitment! You've completed ${completedExercises} wellness exercises. Keep up the self-care!`);
    } else if (completedExercises === 0 && negativeCount > 3) {
      insights.push("You haven't tried any wellness exercises yet. They can help manage stress and improve your mood.");
    }

    // Insight 4: AI usage
    const aiAnalyzed = emotionData.filter(e => e.source === "chrome-ai").length;
    if (aiAnalyzed > 0) {
      insights.push(`${aiAnalyzed} analyses were powered by Chrome's built-in AI for enhanced accuracy.`);
    }

    // Render insights
    insights.forEach(text => {
      const item = document.createElement("div");
      item.className = "insight-item";
      item.innerHTML = `<div class="insight-text">${text}</div>`;
      insightsContainer.appendChild(item);
    });
  }

  // Load and display data
  function loadData() {
    chrome.storage.local.get({ emotionHistory: [], exerciseHistory: [] }, (data) => {
      const allEmotions = data.emotionHistory || [];
      const allExercises = data.exerciseHistory || [];

      // Filter by current period
      const startTime = getDateRange(currentPeriod);
      const filteredEmotions = allEmotions.filter(r => r.ts >= startTime);

      // Count emotions
      const counts = filteredEmotions.reduce((acc, r) => {
        const emotion = r.emotion || "neutral";
        acc[emotion] = (acc[emotion] || 0) + 1;
        return acc;
      }, {});

      // Update UI
      renderChart(counts);
      updateStats(filteredEmotions, allExercises);
      generateInsights(filteredEmotions, allExercises);
    });
  }

  // Time filter buttons
  document.querySelectorAll(".filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      // Update active state
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      // Update period and reload
      currentPeriod = btn.dataset.period;
      loadData();
    });
  });

  // Clear data button
  document.getElementById("clearData").addEventListener("click", () => {
    if (!confirm("⚠️ This will permanently delete all your emotional history and exercise data. Are you sure?")) {
      return;
    }

    chrome.storage.local.set({ 
      emotionHistory: [], 
      exerciseHistory: [] 
    }, () => {
      alert("✅ All data has been cleared.");
      loadData();
    });
  });

  // Export data button
  document.getElementById("exportData").addEventListener("click", () => {
    chrome.storage.local.get({ emotionHistory: [], exerciseHistory: [] }, (data) => {
      const exportData = {
        exportDate: new Date().toISOString(),
        emotions: data.emotionHistory || [],
        exercises: data.exerciseHistory || []
      };

      // Create downloadable JSON file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `wellness-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);

      alert("✅ Data exported successfully!");
    });
  });

  // Initial load
  loadData();

  console.log("[Dashboard] Loaded");

})();
