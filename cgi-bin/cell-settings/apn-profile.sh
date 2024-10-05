#!/bin/sh

# Parse POST data
read -r QUERY_STRING

# Function to urldecode
urldecode() {
    echo -e "$(echo "$1" | sed 's/+/ /g;s/%\([0-9A-F][0-9A-F]\)/\\x\1/g')"
}

# Extract values from POST data
iccidProfile1=$(echo "$QUERY_STRING" | grep -o 'iccidProfile1=[^&]*' | cut -d= -f2)
apnProfile1=$(echo "$QUERY_STRING" | grep -o 'apnProfile1=[^&]*' | cut -d= -f2)
pdpType1=$(echo "$QUERY_STRING" | grep -o 'pdpType1=[^&]*' | cut -d= -f2)
iccidProfile2=$(echo "$QUERY_STRING" | grep -o 'iccidProfile2=[^&]*' | cut -d= -f2)
apnProfile2=$(echo "$QUERY_STRING" | grep -o 'apnProfile2=[^&]*' | cut -d= -f2)
pdpType2=$(echo "$QUERY_STRING" | grep -o 'pdpType2=[^&]*' | cut -d= -f2)

# URL decode the values
iccidProfile1=$(urldecode "$iccidProfile1")
apnProfile1=$(urldecode "$apnProfile1")
pdpType1=$(urldecode "$pdpType1")
iccidProfile2=$(urldecode "$iccidProfile2")
apnProfile2=$(urldecode "$apnProfile2")
pdpType2=$(urldecode "$pdpType2")

echo "Content-type: application/json"
echo ""

# Validate required first profile
if [ -z "$iccidProfile1" ] || [ -z "$apnProfile1" ] || [ -z "$pdpType1" ]; then
    echo '{"status": "error", "message": "Profile 1 is required"}'
    exit 1
fi

# Create the directory structure
mkdir -p /etc/quecmanager

# Create a configuration file to store APN profiles (as plain text)
cat > /etc/quecmanager/apn_config.txt << EOF
iccidProfile1=$iccidProfile1
apnProfile1=$apnProfile1
pdpType1=$pdpType1
EOF

# Add second profile only if ICCID is provided
if [ -n "$iccidProfile2" ]; then
    cat >> /etc/quecmanager/apn_config.txt << EOF
iccidProfile2=$iccidProfile2
apnProfile2=$apnProfile2
pdpType2=$pdpType2
EOF
fi

# Create the apnProfiles.sh script
cat > /etc/quecmanager/apnProfiles.sh << 'EOF'
#!/bin/sh

# Function to read config values
get_config_value() {
    local key=$1
    grep "^${key}=" /etc/quecmanager/apn_config.txt | cut -d'=' -f2
}

# Read configuration
iccidProfile1=$(get_config_value "iccidProfile1")
apnProfile1=$(get_config_value "apnProfile1")
pdpType1=$(get_config_value "pdpType1")
iccidProfile2=$(get_config_value "iccidProfile2")
apnProfile2=$(get_config_value "apnProfile2")
pdpType2=$(get_config_value "pdpType2")

# Function to get current ICCID
get_current_iccid() {
    local input_file="/tmp/inputICCID.txt"
    local output_file="/tmp/outputICCID.txt"
    
    echo "AT+ICCID" > "$input_file"
    atinout "$input_file" /dev/smd11 "$output_file"
    
    iccid=$(cat "$output_file" | grep "+ICCID:" | cut -d' ' -f2)
    
    rm -f "$input_file" "$output_file"
    echo "$iccid"
}

# Function to set APN
set_apn() {
    local pdp_type="$1"
    local apn="$2"
    local input_file="/tmp/inputAPN.txt"
    local output_file="/tmp/outputAPN.txt"
    
    echo "AT+CGDCONT=1,\"$pdp_type\",\"$apn\";+COPS=2;+COPS=0" > "$input_file"
    atinout "$input_file" /dev/smd11 "$output_file"
    
    local result=$(cat "$output_file")
    rm -f "$input_file" "$output_file"
    
    if echo "$result" | grep -q "OK"; then
        return 0
    else
        return 1
    fi
}

# Get current ICCID
current_iccid=$(get_current_iccid)
success=false

# Check ICCID against profile 1 (required)
if [ "$current_iccid" = "$iccidProfile1" ]; then
    if set_apn "$pdpType1" "$apnProfile1"; then
        success=true
    fi
# Check ICCID against profile 2 (optional)
elif [ -n "$iccidProfile2" ] && [ "$current_iccid" = "$iccidProfile2" ]; then
    if set_apn "$pdpType2" "$apnProfile2"; then
        success=true
    fi
fi

if [ "$success" = "true" ]; then
    echo "APN set successfully" > /tmp/apn_result.txt
else
    echo "Failed to set APN" > /tmp/apn_result.txt
fi
EOF

# Make the script executable
chmod +x /etc/quecmanager/apnProfiles.sh

# Add to rc.local if not already present
if ! grep -q "/etc/quecmanager/apnProfiles.sh" /etc/rc.local; then
    sed -i '/^exit 0/i /etc/quecmanager/apnProfiles.sh' /etc/rc.local
fi

# Run the script immediately
/etc/quecmanager/apnProfiles.sh

# Check the result
if [ -f /tmp/apn_result.txt ]; then
    result=$(cat /tmp/apn_result.txt)
    rm -f /tmp/apn_result.txt
    
    if [ "$result" = "APN set successfully" ]; then
        echo '{"status": "success", "message": "APN profiles saved and applied successfully"}'
    else
        echo '{"status": "error", "message": "APN profiles saved but failed to apply"}'
    fi
else
    echo '{"status": "error", "message": "Something went wrong while processing APN profiles"}'
fi