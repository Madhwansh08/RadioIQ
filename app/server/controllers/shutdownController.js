const { execFile } = require('child_process');
const path = require('path');

exports.shutdownPC = (req, res) => {
  const batPath = path.resolve('/scripts/host-script.bat');

  execFile('cmd.exe', ['/c', batPath], (error, stdout, stderr) => {
    if (error) {
      return res.status(500).json({ error: `Shutdown failed: ${error.message}` });
    }
    res.json({ message: 'Shutdown initiated' });
  });
};
