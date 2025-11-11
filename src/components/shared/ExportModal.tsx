import { useState } from 'react';
import { X, Download, CheckSquare, Square } from 'lucide-react';
import * as Papa from 'papaparse';
import type { Asset, AssetType } from '../../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: Asset[];
  assetType: AssetType;
  portfolioTotals?: {
    totalValue: number;
    totalInvested: number;
    totalGainLoss: number;
    totalGainLossPercentage: number;
  };
}

interface ExportColumn {
  key: string;
  label: string;
  enabled: boolean;
}

export function ExportModal({ isOpen, onClose, assets, assetType, portfolioTotals }: ExportModalProps) {
  const [columns, setColumns] = useState<ExportColumn[]>([
    { key: 'symbol', label: 'Symbol', enabled: true },
    { key: 'quantity', label: 'Quantity', enabled: true },
    { key: 'purchasePrice', label: 'Purchase Price', enabled: true },
    { key: 'purchaseDate', label: 'Purchase Date', enabled: true },
    { key: 'currentPrice', label: 'Current Price', enabled: true },
    { key: 'currentValue', label: 'Current Value', enabled: true },
    { key: 'gainLoss', label: 'Gain/Loss ($)', enabled: true },
    { key: 'gainLossPercentage', label: 'Gain/Loss (%)', enabled: true },
  ]);
  const [exportScope, setExportScope] = useState<'all' | 'filtered'>('filtered');
  const [includeSummary, setIncludeSummary] = useState(true);
  const [fileFormat] = useState<'csv'>('csv');
  const [exporting, setExporting] = useState(false);

  const assetLabel = assetType === 'crypto' ? 'Crypto' : 'Stock';

  const toggleColumn = (key: string) => {
    setColumns(columns.map(col =>
      col.key === key ? { ...col, enabled: !col.enabled } : col
    ));
  };

  const toggleAll = () => {
    const allEnabled = columns.every(col => col.enabled);
    setColumns(columns.map(col => ({ ...col, enabled: !allEnabled })));
  };

  const handleExport = () => {
    setExporting(true);

    try {
      const enabledColumns = columns.filter(col => col.enabled);

      if (enabledColumns.length === 0) {
        alert('Please select at least one column to export');
        setExporting(false);
        return;
      }

      // Prepare headers
      const headers = enabledColumns.map(col => col.label);

      // Prepare data rows
      const rows = assets.map(asset => {
        const row: any = {};

        enabledColumns.forEach(col => {
          switch (col.key) {
            case 'symbol':
              row[col.label] = asset.symbol;
              break;
            case 'quantity':
              row[col.label] = assetType === 'crypto'
                ? asset.quantity.toFixed(4)
                : asset.quantity.toFixed(2);
              break;
            case 'purchasePrice':
              row[col.label] = asset.purchase_price.toFixed(2);
              break;
            case 'purchaseDate':
              row[col.label] = new Date(asset.purchase_date).toLocaleDateString();
              break;
            case 'currentPrice':
              row[col.label] = (asset.current_price || 0).toFixed(2);
              break;
            case 'currentValue':
              row[col.label] = (asset.current_value || 0).toFixed(2);
              break;
            case 'gainLoss':
              row[col.label] = (asset.gain_loss || 0).toFixed(2);
              break;
            case 'gainLossPercentage':
              row[col.label] = (asset.gain_loss_percentage || 0).toFixed(2);
              break;
          }
        });

        return row;
      });

      // Add summary if enabled
      let csvContent = '';

      if (includeSummary && portfolioTotals) {
        // Add title
        csvContent += `${assetLabel} Portfolio Export\n`;
        csvContent += `Export Date: ${new Date().toLocaleString()}\n`;
        csvContent += `Total Assets: ${assets.length}\n`;
        csvContent += '\n';

        // Add summary stats
        csvContent += 'Portfolio Summary\n';
        csvContent += `Total Value: $${portfolioTotals.totalValue.toFixed(2)}\n`;
        csvContent += `Total Invested: $${portfolioTotals.totalInvested.toFixed(2)}\n`;
        csvContent += `Total Gain/Loss: $${portfolioTotals.totalGainLoss.toFixed(2)}\n`;
        csvContent += `Total Gain/Loss %: ${portfolioTotals.totalGainLossPercentage.toFixed(2)}%\n`;
        csvContent += '\n';
        csvContent += 'Asset Details\n';
      }

      // Generate CSV using Papa Parse
      const csv = Papa.unparse({
        fields: headers,
        data: rows
      }, {
        quotes: true,
        quoteChar: '"',
        escapeChar: '"',
        delimiter: ',',
        header: true,
        newline: '\n',
      });

      csvContent += csv;

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${assetType}-portfolio-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      // Success - close modal
      setTimeout(() => {
        setExporting(false);
        onClose();
      }, 500);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  const enabledCount = columns.filter(col => col.enabled).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Export {assetLabel} Portfolio
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Customize your export options
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Export Scope */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Export Scope
            </label>
            <div className="space-y-2">
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <input
                  type="radio"
                  name="scope"
                  value="filtered"
                  checked={exportScope === 'filtered'}
                  onChange={(e) => setExportScope(e.target.value as 'all' | 'filtered')}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    Current View ({assets.length} assets)
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Export only the assets shown in your current view with applied filters
                  </div>
                </div>
              </label>
              <label className="flex items-center p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors opacity-50 cursor-not-allowed">
                <input
                  type="radio"
                  name="scope"
                  value="all"
                  checked={exportScope === 'all'}
                  onChange={(e) => setExportScope(e.target.value as 'all' | 'filtered')}
                  className="mr-3"
                  disabled
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    All Assets
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Export all assets (ignoring current filters)
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Columns Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Select Columns ({enabledCount}/{columns.length})
              </label>
              <button
                onClick={toggleAll}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {columns.every(col => col.enabled) ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              {columns.map((column) => (
                <label
                  key={column.key}
                  className="flex items-center gap-2 p-2 hover:bg-white dark:hover:bg-gray-800 rounded cursor-pointer transition-colors"
                >
                  <div className="flex-shrink-0">
                    {column.enabled ? (
                      <CheckSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    ) : (
                      <Square className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  <input
                    type="checkbox"
                    checked={column.enabled}
                    onChange={() => toggleColumn(column.key)}
                    className="sr-only"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    {column.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary Option */}
          <div>
            <label className="flex items-start p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <input
                type="checkbox"
                checked={includeSummary}
                onChange={(e) => setIncludeSummary(e.target.checked)}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900 dark:text-white">
                  Include Portfolio Summary
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Add portfolio totals and statistics at the top of the CSV file
                </div>
              </div>
            </label>
          </div>

          {/* File Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              File Format
            </label>
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <span className="font-mono text-sm text-gray-900 dark:text-white font-semibold">
                CSV
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                (Comma-separated values)
              </span>
              <span className="ml-auto text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded">
                Compatible with Excel, Google Sheets
              </span>
            </div>
          </div>

          {/* Preview Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Your export will include {assets.length} assets with {enabledCount} columns{includeSummary ? ' and portfolio summary' : ''}.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3 bg-gray-50 dark:bg-gray-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={exporting}
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={exporting || enabledCount === 0}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Export to {fileFormat.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
