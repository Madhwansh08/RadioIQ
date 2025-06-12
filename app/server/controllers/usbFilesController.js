const fs = require('fs');
const path = require('path');
const multer = require('multer');

const upload = multer();

/**
 * Detects external USB storage devices for a user, including inside Docker.
 */
function getUsbMountPaths() {
  const roots = [
    `/media/`,
    `/run/media/`
  ];

  let devices = [];

  roots.forEach(root => {
    if (fs.existsSync(root)) {
      try {
        fs.readdirSync(root).forEach(dev => {
          const devicePath = path.join(root, dev);
          let stat;
          try {
            stat = fs.lstatSync(devicePath);
          } catch (err) {
            console.error(`Error reading stats for ${devicePath}:`, err.message);
            return;
          }

          if (stat.isDirectory()) {
            devices.push(devicePath);
          }
        });
      } catch (err) {
        console.error(`Error reading directory ${root}:`, err.message);
      }
    }
  });

  return devices;
}
/**
 * Recursively builds a tree of files and folders starting at dir.
 * Returns an array of entries: { path, name, type: "file"|"directory", children? }
 */
function listFolderTree(dir) {
  if (!fs.existsSync(dir)) return [];

  let entries = [];
  try {
    fs.readdirSync(dir).forEach(file => {
      const filePath = path.join(dir, file);
      let stat;
      try {
        stat = fs.lstatSync(filePath);
      } catch (err) {
        console.error(`Failed to read stats for ${filePath}:`, err.message);
        return;
      }

      if (stat.isDirectory()) {
        entries.push({
          path: filePath,
          name: file,
          type: "directory",
          children: listFolderTree(filePath)
        });
      } else {
        entries.push({
          path: filePath,
          name: file,
          type: "file"
        });
      }
    });
  } catch (err) {
    console.error(`Failed to read directory ${dir}:`, err.message);
  }

  return entries;
}
/**
 * Helper: Promise-based delay
 */
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Express controller: returns a folder tree for all USB devices, with delay for OS to finish mount.
 */
exports.getUsbFiles = async (req, res) => {
  // Wait 200ms before scanning to allow OS/USB to settle
  await delay(200);

  const devices = getUsbMountPaths();
  let output = [];
  devices.forEach(devicePath => {
    let tree = [];
    try {
      tree = listFolderTree(devicePath);
    } catch {}
    output.push({
      device: devicePath,
      tree
    });
  });
  res.json({ devices: output });
};

/**
 * Express controller: saves an uploaded file to selected USB folder.
 * Only allows saving to /media/ subfolders for security reasons.
 */
exports.saveToUsb = [
  upload.single('file'),
  (req, res) => {
    const { targetPath } = req.body;
    const fileBuffer = req.file && req.file.buffer;
    const fileName = req.file && req.file.originalname;

    if (!targetPath || !fileName || !fileBuffer) {
      return res.status(400).json({ error: "Missing targetPath or file" });
    }
    // Security: Only allow saving to /media
    if (!targetPath.startsWith('/media/')) {
      return res.status(403).json({ error: "Invalid USB path" });
    }
    const fullPath = path.join(targetPath, fileName);

    fs.writeFile(fullPath, fileBuffer, err => {
      if (err) {
        return res.status(500).json({ error: "Failed to save file" });
      }
      res.json({ success: true, savedPath: fullPath });
    });
  }
];