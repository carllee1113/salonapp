// Add a simple environment status badge component (client-only) without exposing secrets
"use client";
import React from "react";

const EnvStatus: React.FC = () => {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const status = hasUrl && hasKey ? "Supabase env OK" : "Supabase env missing";
  const color = hasUrl && hasKey ? "bg-gray-200 text-[#1A1A1A]" : "bg-red-600 text-white";

  return (
    <div className={`mt-4 inline-flex items-center rounded-md px-3 py-1 text-xs ${color}`}>
      {status}
    </div>
  );
};

export default EnvStatus;