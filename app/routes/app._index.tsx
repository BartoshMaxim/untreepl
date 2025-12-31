// app/routes/app._index.tsx
import React, { useEffect } from "react";

export default function InstalledLanding() {
  useEffect(() => {
    // Immediately redirect the merchant outside the app.
    // No sync call here because sync is created in afterAuth on the server.
    window.location.href = "https://www.smelo.com/login.html";
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <p>Redirecting…</p>
    </div>
  );
}
