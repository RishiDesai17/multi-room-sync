const { Storage } = require('@google-cloud/storage');

const storage = new Storage({ credentials: require('../../credentials.json') });

exports.checkFileExistence = async (fileName) => {
    const bucket = storage.bucket(process.env.BUCKET_NAME);
    const [fileExists] = await bucket.file(fileName).exists();
    return fileExists;
}

exports.downloadInPieces = async (fileName, io) => {
    // Get the file metadata to determine its size
    const [metadata] = await storage.bucket(process.env.BUCKET_NAME).file(fileName).getMetadata();
    // console.log(metadata);
    const fileSize = metadata.size;
  
    // Define the size of each chunk
    const chunkSize = 100 * 1024; // 100KB
  
    // Calculate the number of chunks required
    const numChunks = Math.ceil(fileSize / chunkSize);
  
    // Download the file in pieces
    for (let i = 0; i < numChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, fileSize) - 1;

      // Create a readable stream for the current chunk
      const stream = storage.bucket(process.env.BUCKET_NAME).file(fileName).createReadStream({
        start,
        end
      });
  
      // Read the current chunk into a buffer
      const chunkBuffer = await new Promise((resolve, reject) => {
        const buffers = [];
        stream.on('data', (chunk) => {
            buffers.push(chunk)
        });
        stream.on('error', reject);
        stream.on('end', () => resolve(Buffer.concat(buffers)));
      });

      // send chunkBuffer via socket
      io.emit("music-chunks", { chunkBuffer, start });
    }
  }
