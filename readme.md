# Setting up a new player

## 1. Raspi-Config
- create `ssh` file iin `/boot` to enable ssh, then find IP address on the network
- `raspi-config` Expand file system
```
$ sudo apt-get update
$ sudo apt-get upgrade
```

## 2. Install environment 
``` 
$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh | bash
$ command -v nvm
```
to confirm

```
$ nvm install stable
$ npm install -g pm2 yarn
$ sudo apt-get install omxplayer fbi
```

## 3. Make sure pi can sudo without password
```
$ sudo nano /etc/sudoers
```

Add this line to the bottom of the file: 

`pi ALL=(ALL:ALL) NOPASSWD:ALL`

## 4. Change pi password
```
$ passwd
```

## 5. Disable splash screen and boot text
```
$ sudo nano /boot/cmdline.txt
```
- Replace `console=tty1` to `console=tty3` to redirect boot messages to the third console.
- Add `loglevel=3` to disable non-critical kernel log messages.
- Add `logo.nologo` to the end of the line to remove the Raspberry PI logos from displaying

```
$ sudo nano /boot/config.txt
```
- add `disable_splash=1` at the end of the file.


## 6. Install the code
```
$ wget https://github.com/conical-io/vodconnect-player/archive/refs/tags/1.1.zip
$ unzip master.zip
$ cd vodconnect-player-master
$ yarn install
```

## 7. Configure PM2 to start and control the node script
```
$ pm2 start index.js
$ pm2 startup
$ pm2 save
```
