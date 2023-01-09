const { exec } = require("node:child_process");
const express = require("express");
const ytdl = require("ytdl-core");
const fs = require("node:fs");

const app = express();
app.use(express.static(`${__dirname}/static`));

const ssus = new Map();

const sus = (videoId, id) => {
    return new Promise((resolve, reject) => {
        ytdl.getInfo(`http://www.youtube.com/watch?v=${videoId}`, { quality: 'highestaudio' }).then(info => {
            const stream = ytdl.downloadFromInfo(info, {
                quality: 'highestaudio'
            });

            stream.pipe(fs.createWriteStream(`${id}.mp4`)).on("finish", () => {
                exec(`${__dirname}\\node_modules\\ffmpeg-static\\ffmpeg.exe -i .\\${id}.mp4 -vn -c:a mp3 ${id}.mp3`).on("error", reject).on("close", () => {
                    exec(`del .\\${id}.mp4`).on("error", reject).on("close", () => {
                        resolve(id);
                    });
                });
            }).on("error", (e) => {
                reject(e);
            });
        });
    });
};

const delet = (id) => {
    exec(`del .\\${id}.mp3`).on("error", (wee) => {console.log(wee)});
    ssus.delete(id);
}

app.get("/neynigganeyney", (req, res) => {
    const { url, id } = req.query;

    ssus.set(id, false);
    
    if (!url || !id) {
        return res.status(400).send("invalid request");
    }

    sus(url.split("?v=")[1], id).then(e => {
        ssus.set(e, true);
    }).catch(e => {
        ssus.set(id, "err");
    });

    res.send("Request send. <script>setTimeout(() => window.location.href = `/ready?id=" + id + "`, 2000)</script>")
});

app.get("/ready", async (req,res) => {
    const id = req.query.id;

    if(!id) {
        return res.status(400).send("invalid request");
    }

    const entry = ssus.get(id);

    if(typeof entry === "undefined") {
        return res.status(400).send("request to invalidate a video fist");
    }

    if(!entry) {
        return res.status(200).send("REQUEST NOT READY YET JUST WAY IT WILL RELOAD AUTOMATICALLY <script>setTimeout(() => location.reload(), 2000)</script>");
    }

    if(entry == "err") {
        res.status(500).send("an error occurred while trying to process your request");
        return delet(id);
    }

    if(entry) {
        res.status(200).sendFile(`${__dirname}\\${id}.mp3`);
        setTimeout(() => {
            return delet(id);
        }, 300)
    }
});

const http = require("http");

const server = http.createServer({}, app).listen(80);

server.keepAliveTimeout = (60 * 1000) + 1000;
server.headersTimeout = (60 * 1000) + 2000;