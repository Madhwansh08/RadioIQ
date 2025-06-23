// const fs = require('fs').promises;
// const path = require('path');
// const multer = require('multer');
// const os = require('os');

// const upload = multer();

// // Helper: List possible drive letters (D: to Z:)
// function getPossibleDriveLetters() {
//   const drives = [];
//   for (let c = 68; c <= 90; c++) { // D-Z
//     drives.push(String.fromCharCode(c));
//   }
//   return drives;
// }

// // Cross-platform: get list of mounted USB paths
// async function getUsbMountPaths() {
//   const detected = [];
//   if (os.platform() === 'win32' || process.env.IS_DOCKER_ON_WINDOWS) {
//     // Check for /mnt/d, /mnt/e, ... in container
//     for (const drive of getPossibleDriveLetters()) {
//       const mountpoint = `/mnt/${drive.toLowerCase()}`;
//       try {
//         const stat = await fs.lstat(mountpoint);
//         if (stat.isDirectory()) {
//           detected.push(mountpoint);
//         }
//       } catch { /* not mounted */ }
//     }
//   } else {
//     // Linux/WSL: /mnt/e, /mnt/f, ...
//     for (const drive of getPossibleDriveLetters()) {
//       const mountpoint = `/media/${drive.toLowerCase()}`;
//       try {
//         const stat = await fs.lstat(mountpoint);
//         if (stat.isDirectory()) {
//           detected.push(mountpoint);
//         }
//       } catch { /* not mounted */ }
//     }
//     // Optionally: add /media/usb* or /run/media/USER/*
//   }
//   return detected;
// }

// async function listFolderTree(dir, depth = 0, maxDepth = 10) {
//   if (depth > maxDepth) return [];
//   let entries = [];
//   try {
//     await fs.access(dir, fs.constants.R_OK);
//     const files = await fs.readdir(dir);
//     for (const file of files) {
//       const filePath = path.join(dir, file);
//       let stat;
//       try { stat = await fs.lstat(filePath); } catch { continue; }
//       if (stat.isDirectory()) {
//         entries.push({
//           path: filePath,
//           name: file,
//           type: "directory",
//           children: await listFolderTree(filePath, depth + 1, maxDepth)
//         });
//       } else {
//         entries.push({
//           path: filePath,
//           name: file,
//           type: "file"
//         });
//       }
//     }
//   } catch { /* ignore inaccessible */ }
//   return entries;
// }

// exports.getUsbFiles = async (req, res) => {
//   try {
//     const devicePaths = await getUsbMountPaths();
//     const output = await Promise.all(
//       devicePaths.map(async devicePath => ({
//         device: devicePath,
//         tree: await listFolderTree(devicePath)
//       }))
//     );
//     res.json({ devices: output });
//   } catch (err) {
//     res.status(500).json({ error: "Failed to fetch USB devices" });
//   }
// };

// exports.saveToUsb = [
//   upload.single('file'),
//   async (req, res) => {
//     const { targetPath } = req.body;
//     const fileBuffer = req.file?.buffer;
//     const fileName = req.file?.originalname;
//     if (!targetPath || !fileName || !fileBuffer) {
//       return res.status(400).json({ error: "Missing targetPath or file" });
//     }
//     // Security: Only allow to /mnt/[d-z]
//     const validRoot = targetPath.match(/^\/mnt\/[d-z](\/|$)/i);
//     if (!validRoot) {
//       return res.status(403).json({ error: "Invalid path: Must be inside /mnt/[d-z]" });
//     }
//     try {
//       const fullPath = path.join(path.resolve(targetPath), fileName);
//       await fs.writeFile(fullPath, fileBuffer);
//       res.json({ success: true, savedPath: fullPath });
//     } catch (err) {
//       res.status(500).json({ error: "Failed to save file" });
//     }
//   }
// ];






const fs = require('fs').promises;
const path = require('path');
const multer = require('multer');
const os = require('os');

const upload = multer();

// Helper: List possible drive letters (D: to Z:)
function getPossibleDriveLetters() {
  const drives = [];
  for (let c = 68; c <= 90; c++) { // D-Z
    drives.push(String.fromCharCode(c));
  }
  return drives;
}

// Cross-platform: get list of mounted USB paths
async function getUsbMountPaths() {
  const detected = [];
  const platform = os.platform();
  // Windows, WSL, or Docker for Windows
  if (platform === 'win32' || process.env.IS_DOCKER_ON_WINDOWS) {
    // Check for /mnt/d, /mnt/e, ... in container/WSL
    for (const drive of getPossibleDriveLetters()) {
      const mountpoint = `/mnt/${drive.toLowerCase()}`;
      try {
        const stat = await fs.lstat(mountpoint);
        if (stat.isDirectory()) {
          detected.push(mountpoint);
        }
      } catch { /* not mounted */ }
    }
  } else {
    // Linux: scan /media/* and /run/media/*
    const roots = ['/media', '/run/media'];
    for (const root of roots) {
      try {
        const users = await fs.readdir(root); // can be usernames or direct mount folders
        for (const userOrDev of users) {
          const userOrDevPath = path.join(root, userOrDev);
          let stat1;
          try {
            stat1 = await fs.lstat(userOrDevPath);
          } catch { continue; }
          if (stat1.isDirectory()) {
            // Inside /run/media/username/usb-label or /media/usb-label
            try {
              const subMounts = await fs.readdir(userOrDevPath);
              for (const sub of subMounts) {
                const devPath = path.join(userOrDevPath, sub);
                let stat2;
                try {
                  stat2 = await fs.lstat(devPath);
                  if (stat2.isDirectory()) {
                    detected.push(devPath);
                  }
                } catch {}
              }
            } catch {
              // Not a sub-mount, possibly /media/usb-label
              detected.push(userOrDevPath);
            }
          }
        }
      } catch {
        // Root doesn't exist; skip
      }
    }
  }
  return detected;
}

// Recursively build a tree of files and folders starting at dir
async function listFolderTree(dir, depth = 0, maxDepth = 10) {
  if (depth > maxDepth) return [];
  let entries = [];
  try {
    await fs.access(dir, fs.constants.R_OK);
    const files = await fs.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      let stat;
      try { stat = await fs.lstat(filePath); } catch { continue; }
      if (stat.isDirectory()) {
        entries.push({
          path: filePath,
          name: file,
          type: "directory",
          children: await listFolderTree(filePath, depth + 1, maxDepth)
        });
      } else {
        entries.push({
          path: filePath,
          name: file,
          type: "file"
        });
      }
    }
  } catch { /* ignore inaccessible */ }
  return entries;
}

// Express controller: returns a folder tree for all USB devices
exports.getUsbFiles = async (req, res) => {
  try {
    // Wait 200ms to let OS/USB settle
    await new Promise(resolve => setTimeout(resolve, 200));
    const devicePaths = await getUsbMountPaths();
    const output = await Promise.all(
      devicePaths.map(async devicePath => ({
        device: devicePath,
        tree: await listFolderTree(devicePath)
      }))
    );
    res.json({ devices: output });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch USB devices" });
  }
};

exports.saveToUsb = [
  upload.single('file'),
  async (req, res) => {
    const { targetPath } = req.body;
    const fileBuffer = req.file?.buffer;
    const fileName = req.file?.originalname;
    if (!targetPath || !fileName || !fileBuffer) {
      return res.status(400).json({ error: "Missing targetPath or file" });
    }
    // Security: Only allow saving to /mnt/[d-z] (Windows/WSL) or /media, /run/media (Linux)
    const validWin = !!targetPath.match(/^\/mnt\/[d-z](\/|$)/i);
    const validMedia = targetPath.startsWith('/media/') || targetPath.startsWith('/run/media/');
    if (!validWin && !validMedia) {
      return res.status(403).json({ error: "Invalid path: Must be inside /mnt/[d-z], /media, or /run/media" });
    }
    try {
      const fullPath = path.join(path.resolve(targetPath), fileName);
      await fs.writeFile(fullPath, fileBuffer);
      res.json({ success: true, savedPath: fullPath });
    } catch (err) {
      res.status(500).json({ error: "Failed to save file" });
    }
  }
];