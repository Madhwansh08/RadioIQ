const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Detects external USB storage devices for a user, including inside Docker.
 */
function getUsbMountPaths() {
  let username;
  try {
    username = os.userInfo().username;
  } catch (e) {
    username = "sajal";
  }
  if (process.env.USB_MEDIA_USER) {
    username = process.env.USB_MEDIA_USER;
  }
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
          } catch {
            return;
          }
          if (stat.isDirectory()) {
            devices.push(devicePath);
          }
        });
      } catch {}
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
      } catch {
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
  } catch {}
  return entries;
}

/**
 * Express controller: returns a folder tree for all USB devices.
 */
exports.getUsbFiles = (req, res) => {
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