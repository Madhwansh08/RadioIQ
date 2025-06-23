import React, { useState } from 'react';

function ShutdownButton() {
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleShutdown = async () => {
    if (!window.confirm("Are you sure you want to shut down the PC?")) return;
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch('http://localhost:7000/shutdown/shut', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'

        }
      });
      const data = await res.json();
      if (res.ok) {
        setResponse('Shutdown initiated!');
      } else {
        setResponse(data.error || 'Shutdown failed');
      }
    } catch (err) {
      setResponse('Network error or server not reachable');
    }
    setLoading(false);
  };

  return (
    <div>
      <button onClick={handleShutdown} disabled={loading}>
        {loading ? 'Shutting down...' : 'Shutdown PC'}
      </button>
      {response && <p>{response}</p>}
    </div>
  );
}

export default ShutdownButton;