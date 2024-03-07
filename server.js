const express = require("express");
require("dotenv").config({ path: __dirname + "/.env" });

const http = require("http")
const socket = require("socket.io")

const { checkFileExistence, downloadInPieces } = require("./utils/gcloud/storage");

let app = express();
let httpServer = app;
app.use(express.json());

if (process.env.SPEAKER_TYPE === "slave") {
    require("./audio/chunk-manager");
}
else {
    httpServer = http.Server(app);
    const io = socket(httpServer);

    io.on("connection", (socket) => {
        console.log("New connection", socket.id);
    })

    app.post("/music/", async (req, res) => {
        try {
            const { fileName } = req.body;
    
            if (!fileName) {
                return res.status(400).json({
                    message: "File name missing in request body"
                });
            }
    
            const fileExists = await checkFileExistence(fileName);
    
            if (!fileExists) {
                return res.status(404).json({
                    message: `File with the name ${req.body.fileName} missing in request body`
                });
            }
    
            downloadInPieces(fileName, io); // will happen in the background
    
            res.status(200).json({
                message: "Playback and streaming started"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    });

    app.post("/music/pause/", async (req, res) => {
        try {
            const { shouldPause } = req.body;
    
            if (!shouldPause) {
                return res.status(400).json({
                    message: "File name missing in request body"
                });
            }
    
            io.emit("music-play-pause", { shouldPause });
    
            res.status(200).json({
                message: "Action completed"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                error
            })
        }
    });
}

const port = process.env.PORT;

httpServer.listen(port, () => {
    console.log(`Server started on port ${port}`);
})
