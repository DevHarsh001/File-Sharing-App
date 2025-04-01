const socket = io();
const fileInput = document.getElementById("fileInput");
fileInput.accept = "*";
const uploadBtn = document.getElementById('uploadBtn');
const linkContainer = document.getElementById('linkContainer');
const progressBar = document.getElementById('progress');
const statusText = document.getElementById('status');

const CHUNK_SIZE = 64 * 1024; // 64KB per chunk

uploadBtn.addEventListener('click', () => {
    const file = fileInput.files[0];
    if (!file) return alert('Please select a file');

    const fileKey = Math.random().toString(36).substring(2, 10);
    let offset = 0;

    function uploadChunk() {
        const chunk = file.slice(offset, offset + CHUNK_SIZE);
        const reader = new FileReader();

        reader.onload = (e) => {
            socket.emit('upload-chunk', { fileKey, name: file.name, chunk: e.target.result, done: offset + CHUNK_SIZE >= file.size });

            offset += CHUNK_SIZE;
            progressBar.style.width = `${(offset / file.size) * 100}%`;

            if (offset < file.size) {
                uploadChunk();
            }
        };

        reader.readAsArrayBuffer(chunk);
    }

    uploadChunk();

    socket.on('link', (link) => {
        linkContainer.innerHTML = `✅ File uploaded! Share this link: <br> 
            <a href="${link}" target="_blank">${link}</a>`;
    });
});

socket.on('status', (msg) => {
    statusText.innerText = msg;
});
