import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';

export const ServerError: React.FC = () => {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA] dark:bg-[#0D1A15] p-4 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="flex justify-center">
          <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-full text-red-650 dark:text-red-400">
            <AlertCircle size={48} />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-satoshi text-[40px] font-bold text-zinc-900 dark:text-zinc-50 tracking-tight leading-none">
            Something went wrong.
          </h1>
          <p className="font-sans text-sm text-text-secondary max-w-xs mx-auto leading-relaxed">
            We encountered an unexpected error on our servers. Please try again or head back to the dashboard.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            onClick={handleRetry}
            className="w-full sm:w-auto bg-[#2D5016] hover:bg-[#1E3810] text-white text-xs font-semibold uppercase tracking-wider rounded-[6px] px-6 py-3 transition-colors duration-150 cursor-pointer"
          >
            Retry Connection
          </button>
          
          <Link to="/dashboard" className="w-full sm:w-auto">
            <button className="w-full border border-border-base bg-bg-surface text-text-primary text-xs font-semibold uppercase tracking-wider rounded-[6px] px-6 py-3 transition-colors duration-150 hover:bg-[#F5F5F5] dark:hover:bg-zinc-850 cursor-pointer">
              Back to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ServerError;
