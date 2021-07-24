import crypto from "crypto";
import http from "http";

const randomData = crypto.randomBytes(1024 * 1024 * 50);

export class Speedtest{
    constructor(){
        var that = this;
        this.options = {
            hostname: 'streamcontrol.alivechurch.org.uk',
            path: "/",
            port: 3000
        }
        that.result = {
            download: null,
            upload: null
        }

        return new Promise(function (resolve, reject) {
            that.TestDownload()
            .then(function () {
                return new Promise(function (a, b) {
                    that.TestUpload(that).then(function () {
                        a();
                    })
                })
            })
            .then(function () {
                resolve(that.result)
            })
        })
    }

    TestDownload(){
        var that = this;
        return new Promise(function (resolve, reject) {
            http.get(that.options, (res) => {
                let oldSize = 0;
                let newSize = 0;
                let baseTime = new Date().getTime();
        
                res.on('error', () => {
                    console.log('Error downloading! Please check your connection information.');
                });
        
                res.on('data', (data) => {
                    newSize += data.length;
                    let currentTime = new Date().getTime();
                    if (currentTime - baseTime > 1000) {
                        baseTime = currentTime;
                        let sizeDiff = newSize - oldSize;
                        //console.log('Download speed: ' + (sizeDiff * 8) + ' Bits/sec');
                        oldSize = newSize;
                    }
                });
        
                res.on('end', () => {
                    let currentTime = new Date().getTime();
                    let finalTime = currentTime - baseTime;
                    let finalSize = newSize - oldSize;
                    let finalSpeed = (finalSize) / (finalTime / 1000);
                    let bps = Math.round(finalSpeed * 8);
                    let mbps = Math.round(bps/1000000);
                    that.result.download = mbps;
                    resolve();
                });
            });
        })
        
    }

    TestUpload(that){
        return new Promise(function (resolve, reject) {
            let baseTime = new Date().getTime();

            that.options.method = 'POST';

            let req = http.request(that.options);

            req.on('error', () => {
                console.log('Error uploading! Please check your connection information.');
            });

            req.end(randomData, () => {
                let currentTime = new Date().getTime();
                let finalTime = currentTime - baseTime;
                let finalSpeed = (1024 * 1024 * 50) / (finalTime / 1000);
                let bps = Math.round(finalSpeed * 8);
                let mbps = Math.round(bps/1000000);

                //console.log('Upload size: ' + (1024 * 1024 * 10 * 8) + ' bits');
                //console.log('Upload speed: ' + bps + ' bits/sec');
                that.result.upload = mbps;
                resolve();
            });
        })
        
    }

}
