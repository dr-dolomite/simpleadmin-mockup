async function fetchCurrentSettings() {
    try {
        const response = await fetch('/cgi-bin/advanced_settings.sh');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Current settings:', data);
        return data;
    } catch (error) {
        console.error('Error fetching current settings:', error);
        return null;
    }
}

fetchCurrentSettings().then(data => {
    if (data) {
        // Update the UI with the current settings
        console.log('Updating the UI with current settings:', data);
    }
});