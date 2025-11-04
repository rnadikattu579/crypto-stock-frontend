import { Plus, Download, BarChart3, Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Plus,
      label: 'Add Asset',
      description: 'Track new investment',
      color: 'bg-blue-500 hover:bg-blue-600',
      onClick: () => navigate('/crypto'),
    },
    {
      icon: BarChart3,
      label: 'Analytics',
      description: 'View detailed reports',
      color: 'bg-purple-500 hover:bg-purple-600',
      onClick: () => navigate('/analytics'),
    },
    {
      icon: Download,
      label: 'Export Data',
      description: 'Download CSV reports',
      color: 'bg-green-500 hover:bg-green-600',
      onClick: () => {},
    },
    {
      icon: Bell,
      label: 'Alerts',
      description: 'Set price notifications',
      color: 'bg-orange-500 hover:bg-orange-600',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={action.onClick}
            className={`${action.color} text-white rounded-lg p-4 transition-all transform hover:scale-105 hover:shadow-lg`}
          >
            <action.icon className="h-8 w-8 mx-auto mb-2" />
            <div className="text-sm font-semibold">{action.label}</div>
            <div className="text-xs opacity-90 mt-1">{action.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
