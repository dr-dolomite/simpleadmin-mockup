
# QuecManager FrontEnd for RM551E

Simple Admin began as part of the RGMII toolkit, offering users a basic GUI.
                                    However, with our fork and continued development, it has evolved to include more
                                    advanced features, making "simple" no longer an ideal name for the dashboard.
                                    Despite this shift, we remain committed to providing advanced functionality while
                                    maintaining an intuitive and user-friendly GUI.


## Installation

Install QuecManager via
```bash
access the filesystem via ftp or WinSCP
merge all the files except README to /www
```

Make sure to make all the scripts executable
```bash
cd /www/cgi-bin
chmod +x ./*
```

If this doesn't work, try to chmod each script.


## Usage/Examples

```bash
go to your browser and type: https://192.168.224.1
```


## Demo

Only the **Home** page works for now.

Custom AT command works but it needs its own cgi-script to use smd7 port. Therefore, expect possible problems with the current version.