const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const uploads = {}; // Store active file uploads

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('upload-chunk', ({ fileKey, name, chunk, done }) => {
        if (!uploads[fileKey]) {
            uploads[fileKey] = { name, data: [], socketId: socket.id };
        }

        uploads[fileKey].data.push(Buffer.from(chunk));

        if (done) {
            uploads[fileKey].data = Buffer.concat(uploads[fileKey].data);
            const link = `http://${socket.handshake.headers.host}/download/${fileKey}`;
            socket.emit('link', link);
            console.log(`✅ File uploaded: ${name}, Link: ${link}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
        for (const key in uploads) {
            if (uploads[key].socketId === socket.id) {
                delete uploads[key];
            }
        }
    });
});

// Serve the download page
app.get('/download/:fileKey', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'download.html'));
});

// API to fetch file info
app.get('/file/:fileKey', (req, res) => {
    const fileKey = req.params.fileKey;
    const file = uploads[fileKey];

    if (!file) {
        return res.status(404).json({ status: 'error', message: 'Uploader not found or offline' });
    }

    res.json({ status: 'online', name: file.name });
});

// API to trigger download
app.get('/download-file/:fileKey', (req, res) => {
    const fileKey = req.params.fileKey;
    const file = uploads[fileKey];

    if (!file) {
        return res.status(404).send('Uploader not found or offline');
    }

    res.set({
        'Content-Disposition': `attachment; filename="${file.name}"`,
        'Content-Type': 'application/octet-stream',
    });

    res.send(file.data);
});

server.listen(3000, () => console.log('🚀 Server running on http://localhost:3000'));
