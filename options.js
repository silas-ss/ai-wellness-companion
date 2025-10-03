// options.js
const DEFAULTS = {
  reminderIntervalMinutes: 120,
  sensitivity: "medium",
  enabledNotifications: true
};

function saveOptions() {
  const interval = parseInt(document.getElementById("interval").value, 10) || DEFAULTS.reminderIntervalMinutes;
  const sensitivity = document.getElementById("sensitivity").value || DEFAULTS.sensitivity;
  const enabledNotifications = document.getElementById("enableNotifications").checked;
  chrome.storage.sync.set({ reminderIntervalMinutes: interval, sensitivity, enabledNotifications }, () => {
    document.getElementById("status").innerText = "Settings saved.";
    // background script listens to storage changes and updates alarms
  });
}

function restoreOptions() {
  chrome.storage.sync.get(DEFAULTS, (items) => {
    document.getElementById("interval").value = items.reminderIntervalMinutes;
    document.getElementById("sensitivity").value = items.sensitivity;
    document.getElementById("enableNotifications").checked = items.enabledNotifications;
  });
}

document.getElementById("save").addEventListener("click", saveOptions);
document.getElementById("deleteAll").addEventListener("click", () => {
  if (!confirm("Delete all stored local history? This cannot be undone.")) return;
  chrome.storage.local.set({ emotionHistory: [] }, () => {
    alert("Local history cleared.");
  });
});
restoreOptions();
