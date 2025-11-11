import { useState, useRef } from 'react';
import { Upload, X, AlertCircle, CheckCircle, FileText, Download } from 'lucide-react';
import * as Papa from 'papaparse';
import type { AssetType } from '../../types';

interface ImportData {
  symbol: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: ImportData[]) => Promise<void>;
  assetType: AssetType;
}

interface ColumnMapping {
  symbol: string;
  quantity: string;
  purchasePrice: string;
  purchaseDate: string;
}

export function ImportModal({ isOpen, onClose, onImport, assetType }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    symbol: '',
    quantity: '',
    purchasePrice: '',
    purchaseDate: '',
  });
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'importing' | 'complete'>('upload');
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [importResults, setImportResults] = useState<{ success: number; failed: number; errors: string[] }>({
    success: 0,
    failed: 0,
    errors: [],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const assetLabel = assetType === 'crypto' ? 'Crypto' : 'Stock';

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith('.csv')) {
        alert('Please select a CSV file');
        return;
      }
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', ';', '\t'],
      complete: (results) => {
        if (results.data.length === 0) {
          alert('CSV file is empty');
          return;
        }

        const headers = Object.keys(results.data[0] as object);
        setHeaders(headers);
        setParsedData(results.data);

        // Try to auto-map columns based on common names
        const autoMapping: ColumnMapping = {
          symbol: findBestMatch(headers, ['symbol', 'ticker', 'coin', 'stock', 'name']),
          quantity: findBestMatch(headers, ['quantity', 'qty', 'amount', 'shares', 'units']),
          purchasePrice: findBestMatch(headers, ['purchaseprice', 'price', 'purchase_price', 'buyprice', 'cost']),
          purchaseDate: findBestMatch(headers, ['purchasedate', 'date', 'purchase_date', 'buydate', 'timestamp']),
        };

        setColumnMapping(autoMapping);
        setStep('mapping');
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
        resetState();
      },
    });
  };

  const findBestMatch = (headers: string[], candidates: string[]): string => {
    const normalizedHeaders = headers.map(h => h.toLowerCase().replace(/[_\s-]/g, ''));
    const normalizedCandidates = candidates.map(c => c.toLowerCase().replace(/[_\s-]/g, ''));

    for (let i = 0; i < normalizedHeaders.length; i++) {
      for (let j = 0; j < normalizedCandidates.length; j++) {
        if (normalizedHeaders[i] === normalizedCandidates[j]) {
          return headers[i];
        }
      }
    }

    return '';
  };

  const validateAndPreview = () => {
    const errors: ValidationError[] = [];
    const requiredFields = ['symbol', 'quantity', 'purchasePrice', 'purchaseDate'];

    // Check if all columns are mapped
    for (const field of requiredFields) {
      if (!columnMapping[field as keyof ColumnMapping]) {
        alert(`Please map the column for: ${field}`);
        return;
      }
    }

    // Validate each row
    parsedData.forEach((row, index) => {
      const symbol = row[columnMapping.symbol]?.toString().trim();
      const quantity = row[columnMapping.quantity];
      const purchasePrice = row[columnMapping.purchasePrice];
      const purchaseDate = row[columnMapping.purchaseDate];

      if (!symbol) {
        errors.push({ row: index + 1, field: 'symbol', message: 'Symbol is required' });
      }

      if (!quantity || isNaN(parseFloat(quantity)) || parseFloat(quantity) <= 0) {
        errors.push({ row: index + 1, field: 'quantity', message: 'Quantity must be a positive number' });
      }

      if (!purchasePrice || isNaN(parseFloat(purchasePrice)) || parseFloat(purchasePrice) <= 0) {
        errors.push({ row: index + 1, field: 'purchasePrice', message: 'Purchase price must be a positive number' });
      }

      if (!purchaseDate) {
        errors.push({ row: index + 1, field: 'purchaseDate', message: 'Purchase date is required' });
      } else {
        const date = new Date(purchaseDate);
        if (isNaN(date.getTime())) {
          errors.push({ row: index + 1, field: 'purchaseDate', message: 'Invalid date format' });
        }
      }
    });

    setValidationErrors(errors);

    if (errors.length > 0) {
      alert(`Found ${errors.length} validation error(s). Please review and fix your CSV file.`);
      return;
    }

    setStep('preview');
  };

  const getMappedData = (): ImportData[] => {
    return parsedData
      .filter(row => {
        // Filter out rows with validation errors
        const symbol = row[columnMapping.symbol]?.toString().trim();
        return symbol && symbol.length > 0;
      })
      .map(row => ({
        symbol: row[columnMapping.symbol].toString().trim().toUpperCase(),
        quantity: parseFloat(row[columnMapping.quantity]),
        purchasePrice: parseFloat(row[columnMapping.purchasePrice]),
        purchaseDate: new Date(row[columnMapping.purchaseDate]).toISOString().split('T')[0],
      }));
  };

  const handleImport = async () => {
    setStep('importing');
    const data = getMappedData();

    try {
      await onImport(data);
      setImportResults({
        success: data.length,
        failed: 0,
        errors: [],
      });
      setStep('complete');
    } catch (error: any) {
      setImportResults({
        success: 0,
        failed: data.length,
        errors: [error.message || 'Import failed'],
      });
      setStep('complete');
    }
  };

  const resetState = () => {
    setFile(null);
    setParsedData([]);
    setHeaders([]);
    setColumnMapping({ symbol: '', quantity: '', purchasePrice: '', purchaseDate: '' });
    setStep('upload');
    setValidationErrors([]);
    setImportResults({ success: 0, failed: 0, errors: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const downloadTemplate = () => {
    const template = `symbol,quantity,purchasePrice,purchaseDate
${assetType === 'crypto' ? 'BTC' : 'AAPL'},1.5,45000.00,2024-01-15
${assetType === 'crypto' ? 'ETH' : 'GOOGL'},5.0,${assetType === 'crypto' ? '3000.00' : '150.00'},2024-02-20
${assetType === 'crypto' ? 'SOL' : 'MSFT'},10.0,${assetType === 'crypto' ? '100.00' : '380.00'},2024-03-10`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${assetType}-import-template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Import {assetLabel} Assets
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {step === 'upload' && 'Upload a CSV file to import your assets'}
              {step === 'mapping' && 'Map your CSV columns to required fields'}
              {step === 'preview' && 'Review data before importing'}
              {step === 'importing' && 'Importing your assets...'}
              {step === 'complete' && 'Import complete'}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'upload' && (
            <div className="space-y-6">
              {/* Download Template */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                      Need a template?
                    </h3>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
                      Download our sample CSV template to see the correct format
                    </p>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download Template
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center hover:border-purple-500 dark:hover:border-purple-400 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {file ? file.name : 'Click to upload or drag and drop'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  CSV files only (comma or semicolon delimited)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {/* CSV Format Requirements */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Required Columns
                </h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      symbol
                    </span>
                    - Asset symbol (e.g., {assetType === 'crypto' ? 'BTC, ETH' : 'AAPL, GOOGL'})
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      quantity
                    </span>
                    - Number of units/shares purchased
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      purchasePrice
                    </span>
                    - Price per unit at time of purchase
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded">
                      purchaseDate
                    </span>
                    - Date of purchase (YYYY-MM-DD format)
                  </li>
                </ul>
              </div>
            </div>
          )}

          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Map your CSV columns to the required fields. We've tried to auto-detect them for you.
                </p>
              </div>

              <div className="space-y-4">
                {(['symbol', 'quantity', 'purchasePrice', 'purchaseDate'] as const).map((field) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {field === 'symbol' && 'Symbol'}
                      {field === 'quantity' && 'Quantity'}
                      {field === 'purchasePrice' && 'Purchase Price'}
                      {field === 'purchaseDate' && 'Purchase Date'}
                      <span className="text-red-500 ml-1">*</span>
                    </label>
                    <select
                      value={columnMapping[field]}
                      onChange={(e) => setColumnMapping({ ...columnMapping, [field]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="">Select column...</option>
                      {headers.map((header) => (
                        <option key={header} value={header}>
                          {header}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Found <span className="font-semibold text-gray-900 dark:text-white">{parsedData.length}</span> rows in your CSV file
                </p>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm text-green-800 dark:text-green-200">
                    Ready to import {getMappedData().length} assets
                  </p>
                </div>
              </div>

              {validationErrors.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-red-800 dark:text-red-200 mb-2">
                        Validation Errors ({validationErrors.length})
                      </p>
                      <div className="max-h-40 overflow-y-auto space-y-1">
                        {validationErrors.slice(0, 10).map((error, index) => (
                          <p key={index} className="text-xs text-red-700 dark:text-red-300">
                            Row {error.row}: {error.field} - {error.message}
                          </p>
                        ))}
                        {validationErrors.length > 10 && (
                          <p className="text-xs text-red-700 dark:text-red-300 font-semibold">
                            ... and {validationErrors.length - 10} more errors
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Symbol
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Purchase Price
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          Purchase Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {getMappedData().slice(0, 50).map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {row.symbol}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {row.quantity.toFixed(assetType === 'crypto' ? 4 : 2)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            ${row.purchasePrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {new Date(row.purchaseDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {getMappedData().length > 50 && (
                  <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 text-center text-xs text-gray-500 dark:text-gray-400">
                    Showing first 50 of {getMappedData().length} assets
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'importing' && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 dark:border-purple-400 mb-4"></div>
              <p className="text-lg font-medium text-gray-900 dark:text-white">
                Importing assets...
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Please wait while we process your data
              </p>
            </div>
          )}

          {step === 'complete' && (
            <div className="space-y-6">
              {importResults.success > 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">
                        Import Successful!
                      </h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Successfully imported {importResults.success} assets
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {importResults.failed > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                        Import Failed
                      </h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mb-3">
                        Failed to import {importResults.failed} assets
                      </p>
                      {importResults.errors.length > 0 && (
                        <div className="space-y-1">
                          {importResults.errors.map((error, index) => (
                            <p key={index} className="text-xs text-red-600 dark:text-red-400">
                              {error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-2">
            {step !== 'upload' && step !== 'complete' && (
              <button
                onClick={() => {
                  if (step === 'mapping') setStep('upload');
                  if (step === 'preview') setStep('mapping');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                disabled={step === 'importing'}
              >
                Back
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {step === 'complete' ? 'Close' : 'Cancel'}
            </button>
            {step === 'mapping' && (
              <button
                onClick={validateAndPreview}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Preview
              </button>
            )}
            {step === 'preview' && (
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                disabled={validationErrors.length > 0}
              >
                Import {getMappedData().length} Assets
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
