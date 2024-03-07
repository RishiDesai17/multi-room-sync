let chunks = [];
let chunkIdx = 0;
let effectType = "";
let playLoop = null;

const getChunkIdx = () => {
    return chunkIdx;
}

const incrementChunkIdx = () => {
    chunkIdx += 1;
}

process.on("message", ({ type, payload }) => {
    if (type === "chunk") {
        chunks.push(payload);
        if (chunks.length === 2) {
            play();
        }
    }
    else if (type === "pause_unpause") {
        if (payload.shouldPause) {
            pause();
        }
        else {
            play();
        }
    }
});

const play = () => {
    playLoop = setInterval(() => {
        const currChunkIdx = getChunkIdx();
        if (currChunkIdx >= chunks.length) {
            clearInterval(playLoop);
        }

        // apply fx

        incrementChunkIdx();
    }, 500);
}

const pause = () => {
    if (playLoop) {
        clearInterval(playLoop);
    }
}
