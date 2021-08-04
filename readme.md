# Setting up a new player

## 1. Install the environment
- npm
- node
- yarn
- pm2
- omxplayer
- fbi

## 2. Make sure pi can sudo without password
```$ sudo nano /etc/sudoers```

Add this line to the bottom of the file: 

`pi ALL=(ALL:ALL) NOPASSWD:ALL`

## 3. Fetch & build the repo

## 4. Disable splash screen and boot text
```$ sudo nano /boot/cmdline.txt ```
- Replace `console=tty1` to `console=tty3` to redirect boot messages to the third console.
- Add `loglevel=3` to disable non-critical kernel log messages.
- Add `logo.nologo` to the end of the line to remove the Raspberry PI logos from displaying

```$ sudo nano /boot/cmdline.txt ```
- add disable_splash=1 at the end of the file.

## 5. Configure PM2 to start and control the node script