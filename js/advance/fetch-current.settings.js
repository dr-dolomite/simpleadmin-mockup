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

function init() {
    fetchCurrentSettings().then(data => {
        if (data) {
            // Parse the data and update the UI

            // Passthrough Mode
            const mpdnRuleLine = data[0].response.split('\n')[1];
            if (mpdnRuleLine) {
                const mpdnRule = mpdnRuleLine.split(":")[1].trim();
                switch (mpdnRule) {
                    case '"MPDN_rule",0,0,0,0,0':
                        document.getElementById('ip-passthrough-mode').value = 'Disabled';
                        break;
                    case '"MPDN_rule",0,1,0,1,1':
                        document.getElementById('ip-passthrough-mode').value = 'ETH Only';
                        break;
                    case '"MPDN_rule",0,1,0,3,1':
                        document.getElementById('ip-passthrough-mode').value = 'USB Only';
                        break;
                    default:
                        document.getElementById('ip-passthrough-mode').value = 'Select IP Passthrough Mode';
                        break;
                }
            }

            // DNS Proxy
            const dnsProxyLine = data[1].response.split('\n')[1].split(":")[1].split(",")[1].trim();
            if (dnsProxyLine) {
                dnsProxyLine === '"disable"' ? document.getElementById('dns-proxy-mode').value = 'Disabled' : document.getElementById('dns-proxy-mode').value = 'Enabled';
            } else {
                document.getElementById('dns-proxy-mode').value = 'Select Onboard DNS Proxy';
            }
        } else {
            alert('Failed to fetch current settings. Please refresh the page.');
        }
    });
}

// run init when the DOM is ready and page is loaded
document.addEventListener('DOMContentLoaded', init);