# simpleadmin-mockup

```
mkdir /www/custom-ui
```

then paste all of the files inside of this folder into /www/custom-ui.

go to /etc/config and edit uhttpd into this:
```
config uhttpd 'main'
        list listen_http '0.0.0.0:80'
        list listen_http '[::]:80'
        list listen_https '0.0.0.0:443'
        list listen_https '[::]:443'
        option redirect_https '0'
        option home '/www'
        option rfc1918_filter '1'
        option max_requests '3'
        option max_connections '100'
        option cert '/etc/uhttpd.crt'
        option key '/etc/uhttpd.key'
        option cgi_prefix '/cgi-bin'
        list lua_prefix '/cgi-bin/luci=/usr/lib/lua/luci/sgi/uhttpd.lua'
        option script_timeout '60'
        option network_timeout '30'
        option http_keepalive '20'
        option tcp_keepalive '1'
        option ubus_prefix '/ubus'

config uhttpd 'my_custom_ui'
    list listen_http '0.0.0.0:8080'   # Listen on all interfaces on port 8080
    option home '/www/custom-ui'      # The directory where your custom UI (index.html) is located
    option rfc1918_filter '1'
    option max_requests '3'
    option max_connections '100'
    option tcp_keepalive '1'
    option ubus_prefix '/ubus'
    option cgi_prefix '/cgi-bin'
    option script_timeout '60'


config cert 'defaults'
        option days '730'
        option key_type 'ec'
        option bits '2048'
        option ec_curve 'P-256'
        option country 'ZZ'
        option state 'Somewhere'
        option location 'Unknown'
        option commonname 'OpenWrt'
```

then restart uhttpd
```
/etc/init.d/uhttpd restart
```

try if the custom AT command works by going to:
http://192.168.224.1:8080

login with admin/password123

then click Advanced