import React, { useState, useEffect } from 'react';

const CustomDropdown = ({ value, onChange, options, error, className = "", buttonClassName = "px-4 py-3 text-sm" }) => {
  const [open, setOpen] = useState(false);
  const ref = React.useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedOption = options.find(opt => opt.value === value) || options[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center justify-between bg-gray-50 dark:bg-white/5 border rounded-xl font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${buttonClassName} ${
          error ? "border-red-400 bg-red-50/30" : "border-gray-200 dark:border-white/10"
        }`}
      >
        <span>{selectedOption?.label}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-gray-400 transition-transform duration-150 ml-2 ${open ? "rotate-180" : "rotate-0"}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1.5 w-full min-w-max right-0 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl animate-slide-up">
          <div className="overflow-y-auto" style={{ maxHeight: "160px" }}>
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors text-left ${
                  opt.value === value
                    ? "bg-primary/10 text-primary dark:text-primary-light font-semibold"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {opt.label}
                {opt.value === value && (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomDropdown;
