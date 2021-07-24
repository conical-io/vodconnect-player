import level from "level";
import { io } from "socket.io-client";
import { MakeID } from "../tools.js";
import { Speedtest } from "./speed-test.js";
import os, { totalmem } from "os";


export class App {
    constructor(){
        var that = this;
        this.store = level('vodconnect-player-data');
        this.unique_id = null;
        this.socket = null;
        this.connected = false;
        this.runningSpeedTest = false;

        this.Init()
        .then(function() {
            that.InitSocket(that)
        });
        
    }
    Init(){
        var that = this;
        return new Promise(function(resolve, reject) {
            that.OSStatSend()
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
        const socket = io("http://streamcontrol.alivechurch.org.uk:3001");
        socket.on("connect", function(){
            that.socket = socket;
            that.connected = true;
            that.ActionSendUID()
        })
        socket.on("disconnect", function(){
            that.socket = null;
            that.connected = false;
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
                console.log("stop playing")
            }else if(data.command=="play"){
                console.log("play command")
                console.log(data)
                
                //perform omx play
            }else if(data.command=="hold"){
                //put on a holding slide
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


    Emit(a,b){
        if(this.socket && this.socket!==null && this.connected){
            this.socket.emit(a, b)
        }
    }


}