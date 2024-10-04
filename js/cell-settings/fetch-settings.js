// State variables to track current values
let currentSettings = {
  apn: "",
  pdpType: "",
  networkMode: "",
};

let updatedSettings = {
  apn: "",
  pdpType: "",
  networkMode: "",
};

// Function to check if settings have changed
function haveSettingsChanged() {
  return (
    currentSettings.apn !== updatedSettings.apn ||
    currentSettings.pdpType !== updatedSettings.pdpType ||
    currentSettings.networkMode !== updatedSettings.networkMode
  );
}

// Function to send settings to the modem
async function saveSettings() {
  if (!haveSettingsChanged()) {
    alert("No changes detected in the settings.");
    return;
  }

  try {
    const atCommand = `AT+QMBNCFG="AutoSel",0;+CGDCONT=1,"${updatedSettings.pdpType}","${updatedSettings.apn}"`
    console.log("Sending AT command:", atCommand);

    const response = await sendATCommand(atCommand);
    console.log("AT command response:", response);

    await sendATCommand(`AT+CFUN=0`);
    // Wait for 2 seconds before turning on the modem
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await sendATCommand(`AT+CFUN=1`);

    // Update current settings after successful save
    currentSettings = { ...updatedSettings };
    alert("Settings saved successfully!");
  } catch (error) {
    console.error("Error saving settings:", error);
    alert("Error saving settings. Please try again.");
  }
}

async function resetAPN() {
  atCommand = `AT+QMBNCFG="AutoSel",1`;
  console.log("Sending AT command:", atCommand);

  try {
    const response = await sendATCommand(atCommand);
    console.log("AT command response:", response);

    // Restart connection after resetting APN settings
    await sendATCommand("AT+CFUN=0");
    // Wait for 2 seconds before turning on the modem
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await sendATCommand("AT+CFUN=1");
    alert("APN settings reset successfully!");
  } catch (error) {
    console.error("Error resetting APN settings:", error);
    alert("Error resetting APN settings. Please try again.");
  }
}

async function sendATCommand(command) {
  try {
    const response = await fetch("/cgi-bin/atinout_handler.sh", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "command=" + encodeURIComponent(command),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error sending AT command:", error);
    throw error;
  }
}

// Function to fetch cell settings data
async function fetchCellSettings() {
  try {
    const response = await fetch("/cgi-bin/cell-settings.sh");

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Full response:", data);

    data.forEach((item) => {
      if (item.response.includes("CGDCONT?")) {
        const apn = item.response
          .split("\n")[1]
          .split(":")[1]
          .split(",")[2]
          .replace(/"/g, "")
          .trim();

        currentSettings.apn = apn;
        updatedSettings.apn = apn;

        const apnInput = document.getElementById("currentAPN");
        if (apnInput) {
          apnInput.value = apn;

          // Add event listener for APN changes
          if (!apnInput.hasListener) {
            apnInput.hasListener = true;
            apnInput.addEventListener("input", (e) => {
              updatedSettings.apn = e.target.value;
            });
          }
        }

        const pdpType = item.response
          .split("\n")[1]
          .split(":")[1]
          .split(",")[1]
          .replace(/"/g, "")
          .trim();

        currentSettings.pdpType = pdpType;
        updatedSettings.pdpType = pdpType;

        const pdpTypeSelect = document.getElementById("apnPDP");
        if (pdpTypeSelect) {
          // Set initial value
          pdpTypeSelect.value =
            pdpType === "IPV4V6"
              ? "IPV4V6"
              : pdpType === "IPV6"
              ? "IPV6"
              : pdpType === "PPP"
              ? "PPP"
              : "IP";

          // Add event listener for PDP type changes
          if (!pdpTypeSelect.hasListener) {
            pdpTypeSelect.hasListener = true;
            pdpTypeSelect.addEventListener("change", (e) => {
              updatedSettings.pdpType = e.target.value;
            });
          }
        }
      } else if (item.response.includes("QNWPREFCFG")) {
        const networkMode = item.response
          .split("\n")[1]
          .replace("+QNWPREFCFG: ", "")
          .split(",")[1]
          .trim();

        currentSettings.networkMode = networkMode;
        updatedSettings.networkMode = networkMode;

        const networkSelect = document.getElementById("networkPreference");
        if (networkSelect) {
          // Set initial value based on actual value from modem
          networkSelect.value =
            networkMode === "LTE:NR5G"
              ? "NR5G:LTE"
              : networkMode === "NR5G"
              ? "NR5G"
              : networkMode === "LTE"
              ? "LTE"
              : "AUTO";

          // Add event listener for network mode changes
          if (!networkSelect.hasListener) {
            networkSelect.hasListener = true;
            networkSelect.addEventListener("change", (e) => {
              updatedSettings.networkMode = e.target.value;
            });
          }
        }
      }
    });
  } catch (error) {
    console.error("Error fetching cell settings:", error);
  }
}

// Initialize when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  fetchCellSettings();

  // Add event listener for both save buttons
  const saveButtons = document.querySelectorAll(".card-footer-item");
  saveButtons.forEach((button) => {
    if (button.textContent.trim() === "Save APN") {
      button.addEventListener("click", saveSettings);
    } else if (button.textContent.trim() === "Reset APN") {
      button.addEventListener("click", resetAPN);
    }
  });
});
