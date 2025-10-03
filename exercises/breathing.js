// breathing.js
const circle = document.getElementById("circle");
const guide = document.getElementById("guide");
let intervalId = null;
let stepIndex = 0;
const steps = [
  { text: "Inhale slowly", duration: 4000 },
  { text: "Hold", duration: 4000 },
  { text: "Exhale slowly", duration: 6000 },
  { text: "Relax", duration: 2000 }
];

function updateUI() {
  const s = steps[stepIndex];
  circle.innerText = s.text;
  // scale animation
  const scale = 1 + (stepIndex === 0 ? 0.3 : (stepIndex === 2 ? -0.2 : 0));
  circle.style.transform = `scale(${scale})`;
}

function startCycle() {
  if (intervalId) return;
  updateUI();
  intervalId = setInterval(() => {
    stepIndex = (stepIndex + 1) % steps.length;
    updateUI();
  }, steps[stepIndex].duration);
  // record a small "session" event
  chrome.storage.local.get({ emotionHistory: [] }, (data) => {
    const arr = data.emotionHistory || [];
    arr.push({ ts: Date.now(), event: "exercise_started", exercise: "breathing" });
    chrome.storage.local.set({ emotionHistory: arr });
  });
}

function stopCycle() {
  if (!intervalId) return;
  clearInterval(intervalId);
  intervalId = null;
  circle.innerText = "Paused";
  circle.style.transform = "scale(1)";
}

document.getElementById("start").addEventListener("click", startCycle);
document.getElementById("stop").addEventListener("click", stopCycle);
document.getElementById("close").addEventListener("click", () => window.close());
