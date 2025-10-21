import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimeoutWarningDialogProps {
  isOpen: boolean;
  onContinue: () => void;
  countdownSeconds?: number;
}

export function TimeoutWarningDialog({
  isOpen,
  onContinue,
  countdownSeconds = 30,
}: TimeoutWarningDialogProps) {
  const [secondsLeft, setSecondsLeft] = useState(countdownSeconds);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(countdownSeconds);
      return;
    }

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, countdownSeconds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 animate-slideUp">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-100 rounded-full">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Session Timeout Warning
              </h3>
              <p className="text-gray-600 mb-4">
                You've been inactive for a while. Your session will expire in{' '}
                <span className="font-bold text-yellow-600">{secondsLeft}</span> seconds
                due to inactivity.
              </p>
              <p className="text-sm text-gray-500">
                Click "Stay Logged In" to continue your session, or you'll be automatically logged out.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onContinue}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Stay Logged In
          </button>
        </div>
      </div>
    </div>
  );
}
