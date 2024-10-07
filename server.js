const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const progress = require('progress-stream');
const app = express();
const uploadFolder = 'uploads';

// Create uploads folder if it doesn't exist
if (!fs.existsSync(uploadFolder)) {
    fs.mkdirSync(uploadFolder);
}

// Serve static files like HTML and CSS
app.use(express.static(__dirname));

// Enable compression (gzip)
app.use(compression());

// Remove file size limits for large file uploads
app.use(express.json({ limit: 'Infinity' }));
app.use(express.urlencoded({ limit: 'Infinity', extended: true }));

// Multer configuration: Allow any size file upload (no limit)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ 
    storage: storage // No file size limit
});

// Route for file uploads with progress tracking
app.post('/upload', (req, res) => {
    const progressStream = progress();

    // Use multer's upload function to handle file upload
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err);
            return res.status(500).send('An error occurred during the upload.');
        }

        req.pipe(progressStream);

        progressStream.on('progress', (progress) => {
            console.log(`Upload progress: ${progress.percentage.toFixed(2)}% complete`);
        });

        res.status(200).send("Upload complete");
    });
});

// Route to list available files for download
app.get('/files', (req, res) => {
    fs.readdir(uploadFolder, (err, files) => {
        if (err) {
            return res.status(500).json({ error: 'Unable to list files.' });
        }
        res.json(files);
    });
});

// Route to download a file
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, uploadFolder, filename);
    res.download(filePath);
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
