"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, X, Loader2, AlertCircle } from "lucide-react";

interface ScanningToastProps {
  totalEmails: number;
  connectionId: string;
  onComplete: (actionsFound: number) => void;
  onDismiss: () => void;
}

export function ScanningToast({ totalEmails, connectionId, onComplete, onDismiss }: ScanningToastProps) {
  const [status, setStatus] = useState<"scanning" | "complete" | "error">("scanning");
  const [actionsFound, setActionsFound] = useState(0);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (totalEmails === 0) {
      setStatus("complete");
      setProgress(100);
      onComplete(0);
      return;
    }

    // Start the actual scan
    const performScan = async () => {
      try {
        // Animate progress while scanning
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) return prev;
            return prev + Math.random() * 10;
          });
        }, 300);

        const response = await fetch("/api/emails/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ connectionId }),
        });

        clearInterval(progressInterval);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Scan failed");
        }

        const data = await response.json();
        setProgress(100);
        setActionsFound(data.processed || 0);
        setStatus("complete");
        onComplete(data.processed || 0);
      } catch (error) {
        console.error("Scan error:", error);
        setStatus("error");
        setErrorMessage(error instanceof Error ? error.message : "Scan failed");
      }
    };

    performScan();
  }, [totalEmails, connectionId, onComplete]);

  return (
    <div style={{
      width: '360px',
      backgroundColor: '#5C4A32',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          flexShrink: 0,
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: status === "error" ? 'rgba(239, 68, 68, 0.2)' : 'rgba(196, 164, 132, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {status === "scanning" ? (
            <Loader2 style={{ width: '20px', height: '20px', color: '#C4A484', animation: 'spin 1s linear infinite' }} />
          ) : status === "error" ? (
            <AlertCircle style={{ width: '20px', height: '20px', color: '#ef4444' }} />
          ) : (
            <CheckCircle2 style={{ width: '20px', height: '20px', color: '#C4A484' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontWeight: 500, color: '#FFF3D5' }}>
              {status === "scanning" ? "Scanning emails..." : status === "error" ? "Scan failed" : "Scan complete"}
            </span>
            {status !== "error" && (
              <span style={{ fontSize: '14px', color: '#C4A484' }}>
                {totalEmails} email{totalEmails !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Progress bar */}
          <div style={{
            height: '8px',
            backgroundColor: '#3D3428',
            borderRadius: '4px',
            overflow: 'hidden',
            marginBottom: '8px'
          }}>
            <div style={{
              height: '100%',
              backgroundColor: status === "error" ? '#ef4444' : '#FFF3D5',
              borderRadius: '4px',
              transition: 'width 300ms ease-out',
              width: `${progress}%`
            }} />
          </div>

          <p style={{ fontSize: '14px', color: 'rgba(255, 243, 213, 0.8)' }}>
            {status === "scanning"
              ? "AI is analyzing your emails for action items..."
              : status === "error"
              ? errorMessage
              : actionsFound > 0
              ? `Found ${actionsFound} action item${actionsFound !== 1 ? "s" : ""}!`
              : "No new action items found in these emails."}
          </p>
        </div>

        <button
          onClick={onDismiss}
          style={{
            flexShrink: 0,
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#C4A484',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          <X style={{ width: '16px', height: '16px' }} />
        </button>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
