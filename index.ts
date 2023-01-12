import { exec } from "node:child_process";
import sanitize from "sanitize-filename";
import promptsync from "prompt-sync";
import ytdl from "ytdl-core";
import fs from "node:fs";
import "dotenv/config"

const prompt = promptsync();

const path = process.env.OUTDIR || ".\\temp";

const download = (videoId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        ytdl.getInfo(`http://www.youtube.com/watch?v=${videoId}`).then(info => {
            const stream = ytdl.downloadFromInfo(info, {
                quality: 'highestaudio'
            });

            const title = sanitize(info.player_response.videoDetails.title);
            const author = info.player_response.videoDetails.author;
            console.log(title);

            const after = () => {
                stream.pipe(fs.createWriteStream(`${path}\\${title}.mp4`)).on("finish", () => {
                    exec(`${__dirname}\\node_modules\\ffmpeg-static\\ffmpeg.exe -i "${path}\\${title}.mp4" -metadata title="${title}" -metadata artist="${author}" -vn -c:a mp3 "${path}\\${title}.mp3"`).on("error", reject).on("close", () => {
                        exec(`del "${path}\\${title}.mp4"`).on("error", reject).on("close", () => {
                            resolve(title);
                        });
                    });
                }).on("error", (e) => {
                    reject(e);
                });
            }

            if (fs.existsSync(`${path}\\${title}.mp4`)) {
                const des = prompt(`Do you want to overwrite file: ${path}\\${title}.mp4? `);
                if (!["yes", "y", "confirm"].includes(des!)) return;
                exec(`del "${path}\\${title}.mp4"`).on("error", reject).on("close", () => {
                    return after();
                });
            }

            if (fs.existsSync(`${path}\\${title}.mp3`)) {
                const des = prompt(`Do you want to overwrite file: ${path}\\${title}.mp3? `);
                if (!["yes", "y", "confirm"].includes(des!)) return;
                exec(`del "${path}\\${title}.mp3"`).on("error", reject).on("close", () => {
                    resolve(title);
                    return after();
                });
            }

            after();
        });
    });
};

const _interface = async () => {
    const res = prompt("Please enter the video link to download: ");
    if (!res || res === "exit") return process.exit(0);
    const id = ytdl.getURLVideoID(res);
    await download(id);
    _interface();
}

_interface();
