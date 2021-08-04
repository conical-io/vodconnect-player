import level from "level";
import { io } from "socket.io-client";
import { MakeID } from "../tools.js";
import { Speedtest } from "./speed-test.js";
import os, { totalmem } from "os";
import omx from "node-omxplayer";
import {exec}  from "child_process";
import path from "path";
const __dirname = path.resolve(path.dirname(''));

export class App {
    constructor(){
        var that = this;
        this.store = level('vodconnect-player-data');
        this.unique_id = null;
        this.socket = null;
        this.connected = false;
        this.runningSpeedTest = false;
        this.omxplayer = null;
        this.audioOutput = "local",

        this.Init()
        .then(function() {
            that.InitSocket(that)
        });
        
    }
    Init(){
        var that = this;
        return new Promise(function(resolve, reject) {
            that.OSStatSend()
            that.HoldingScreen()
            //set unique ID
            that.store.get('unique_id', function (err, value) {
                if(err){
                    //no unique id = make one
                    var newId = MakeID(8);
                    that.store.put('unique_id', newId);
                    that.unique_id = newId;
                    resolve()
                }else{
                    that.unique_id = value;
                    resolve()
                }
            })
        });
        
    }
    InitSocket(that){
        const socket = io("http://alive.vodconnect.live:3001");
        socket.on("connect", function(){
            that.socket = socket;
            that.connected = true;
            that.ActionSendUID();
            console.log("connected!")
            that.HoldingScreen();
        })
        socket.on("disconnect", function(){
            that.socket = null;
            that.connected = false;
            that.HoldingScreen();
            setTimeout(function () {
                if(!that.connected){
                    socket.connect()
                }
            }, 5000);
        })
        socket.on("command", function(data){
            
            if(data.command=="speedtest"){
               //init a speed test
               that.Speedtest()
            }else if(data.command=="stop"){
            //perform omx stop
                that.Stop()
            }else if(data.command=="play"){
                that.Play(data);
                
                //perform omx play
            }else if(data.command=="hold"){
                //put on a holding slide
            }else if(data.command=="reboot"){
                that.Reboot()
            }else if(data.command=="ping"){
                //pong
                that.Emit("pong", data);
            }
        })
    }
    Speedtest(){
        if(!this.runningSpeedTest){
            var that = this;
            this.runningSpeedTest = true;
            this.Emit("update", {key:"speedtesting", value: true});
            new Speedtest().then(function (response) {
                that.Emit("speedtest", response);
                that.Emit("update", {key:"speedtesting", value: false});
                that.runningSpeedTest = false;
            })
        }
    }
    OSStatSend(){
        var that = this;
        var totalMem = os.totalmem();
        var totalMemGb = parseFloat(parseFloat(totalMem/1073741824).toFixed(2));
        var freeMem = os.freemem();
        var freeMemGb = parseFloat(parseFloat(freeMem/1073741824).toFixed(2));
        var usedMem = totalMem-freeMem;
        var usedMemGb = parseFloat(parseFloat(usedMem/1073741824).toFixed(2));
        var usagePerc = parseFloat(parseFloat(usedMem/totalMem*100).toFixed(2));
        var loadAvg = os.loadavg();
        var upTime = os.uptime();
        var cpus = os.cpus();
        var usage = {
            totalMem: totalmem,
            totalMemGB: totalMemGb,
            freeMem: freeMem,
            freeMemGB: freeMemGb,
            usedMem: usedMem,
            usedMemGB: usedMemGb,
            memoryUsagePerc: usagePerc,
            cpus: cpus.length, 
            la: loadAvg
        }
        that.Emit("oslogs", usage);
        setTimeout(function () {
            that.OSStatSend()  
        },10000)
        
    }

    ActionSendUID(){
        if(this.connected && this.socket!=null){
            this.Emit("UID", {data: this.unique_id})
        }
    }

    Play(data){
        if(this.omxplayer!==null){
            this.omxplayer.quit();
            this.omxplayer = null;
        }
        console.log("play " + data.data.src)
        this.omxplayer = omx(data.data.src, this.audioOutput)
    }
    Stop(data){
        if(this.omxplayer!==null){
            this.omxplayer.quit();
            this.omxplayer = null;
        }
        exec("sudo killall -9 omxplayer.bin", function(error, stdout, stderr){
            if(error){
                console.log(error);
                return
            }
            if(stderr){
                console.log(stderr);
                return
            }
            console.log(stdout)
        });
    }
    Reboot(){
        exec("sudo reboot", function(error, stdout, stderr){
            if(error){
                console.log(error);
                return
            }
            if(stderr){
                console.log(stderr);
                return
            }
            console.log(stdout)
        });
    }
    HoldingScreen(){
        var that = this;
        //media path
        var mediaPath = "/home/pi/vodconnect-player"
        var connectedScreen = mediaPath + "/media/connected.jpg";
        var notconnectedScreen = mediaPath + "/media/not-connected.jpg";
        exec("sudo killall -9 fbi");
        setTimeout(function(){
            var file = notconnectedScreen
            if(that.connected){
                file = connectedScreen
            }

            exec("sudo fbi -d /dev/fb0 -T 1 " + file + " --nocomments --noverbose --noaudtoup --noautodown", function(error, stdout, stderr){
                if(error){
                    console.log(error);
                    return
                }
                if(stderr){
                    console.log(stderr);
                    return
                }
                console.log(stdout)
            });
        }, 1000);
    }

    Emit(a,b){
        if(this.socket && this.socket!==null && this.connected){
            this.socket.emit(a, b)
        }
    }


}