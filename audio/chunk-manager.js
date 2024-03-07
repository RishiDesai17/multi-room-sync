const { fork } = require('child_process');

const io = require('socket.io-client');

const socket = io(process.env.MASTER_SPEAKER_URL);

class AudioInfo {
    childProcessRef = null;
    filename = null;

    constructor(filename) {
        this.filename = filename;
    }

    getFileName() {
        return this.filename;
    }

    getChildProcessRef() {
        return this.childProcessRef;
    }

    setChildProcessRef(childProcessRef) {
        this.childProcessRef = childProcessRef;
    }
}

let audioInfoInstance = null;

socket.on("music-chunks", (data) => {
    const chunkBuffer = data.chunkBuffer;
    const start = data.start;

    if (!audioInfoInstance || audioInfoInstance.getFileName() !== data.filename) {
        audioInfoInstance = new AudioInfo(data.filename);
        audioInfoInstance.setChildProcessRef(fork(__dirname + '/read-audio.js'));
    }

    // console.log("chunkBuffer", chunkBuffer);

    audioInfoInstance.getChildProcessRef().send({ type: "chunk", payload: chunkBuffer });
});

socket.on("music-play-pause", (data) => {
    if (audioInfoInstance && !audioInfoInstance.getChildProcessRef().completed) {
        audioInfoInstance.getChildProcessRef().send({
            type: "pause_unpause",
            payload: { shouldPause: data.shouldPause }
        });
    }
});
