#!/bin/sh

echo "Content-type: application/json"
echo ""

ttl_file="/etc/firewall.user.ttl"

case "$REQUEST_METHOD" in
    GET)
        if [ -s "$ttl_file" ]; then
            ttl_value=$(grep 'iptables -t mangle -A POSTROUTING' "$ttl_file" | awk '{for(i=1;i<=NF;i++){if($i=="--ttl-set"){print $(i+1)}}}')
            echo "{\"isEnabled\": true, \"currentValue\": $ttl_value}"
        else
            echo "{\"isEnabled\": false, \"currentValue\": 0}"
        fi
        ;;
    POST)
        read -r post_data
        ttl_value=$(echo "$post_data" | sed 's/ttl=//')
        
        if [ "$ttl_value" = "0" ]; then
            > "$ttl_file"
            echo "{\"success\": true}"
        elif [[ "$ttl_value" =~ ^[0-9]+$ ]]; then
            echo "iptables -t mangle -A POSTROUTING -o rmnet+ -j TTL --ttl-set $ttl_value" > "$ttl_file"
            echo "ip6tables -t mangle -A POSTROUTING -o rmnet+ -j HL --hl-set $ttl_value" >> "$ttl_file"
            
            # Apply the rules
            iptables -t mangle -A POSTROUTING -o rmnet+ -j TTL --ttl-set "$ttl_value"
            ip6tables -t mangle -A POSTROUTING -o rmnet+ -j HL --hl-set "$ttl_value"
            
            echo "{\"success\": true}"
        else
            echo "{\"success\": false}"
        fi
        ;;
esac