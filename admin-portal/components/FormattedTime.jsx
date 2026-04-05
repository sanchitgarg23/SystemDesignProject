"use client";

import { useState, useEffect } from "react";

const FormattedTime = ({ date, className }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <span className={className}>Loading...</span>;

  const d = date ? new Date(date) : new Date();
  
  return (
    <span className={className}>
      {d.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })}
    </span>
  );
};

export default FormattedTime;
