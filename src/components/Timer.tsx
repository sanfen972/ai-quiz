import { useState, useEffect, useRef } from 'react';

interface Props {
  seconds: number;
  onTimeout: () => void;
  running: boolean;
}

export default function Timer({ seconds, onTimeout, running }: Props) {
  const [remaining, setRemaining] = useState(seconds);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;
  const calledRef = useRef(false);

  useEffect(() => {
    if (!running) return;
    setRemaining(seconds);
    calledRef.current = false;
  }, [seconds, running]);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          if (!calledRef.current) {
            calledRef.current = true;
            setTimeout(() => onTimeoutRef.current(), 0);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;

  return (
    <div className={`timer ${remaining <= 60 ? 'urgent' : ''}`}>
      {String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </div>
  );
}
