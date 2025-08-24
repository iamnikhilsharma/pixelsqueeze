import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { PhotoIcon, ChartBarIcon, EyeIcon, CogIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from './Button';
import { useAuthStore } from '@/store/authStore';
import { formatFileSize, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';

const ImageAnalyzer: React.FC = () => {
  const { user, token } = useAuthStore();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFile, setCurrentFile] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [analysisOptions, setAnalysisOptions] = useState({
    extractMetadata: true,
    analyzeColors: true,
    assessQuality: true,
    generateRecommendations: true,
    detailedAnalysis: false
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = files.filter(file => 
      file.type.startsWith('image/') && 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff', 'image/bmp'].includes(file.type)
    );
    
    if (imageFiles.length === 0) {
      toast.error('Please select valid image files (JPEG, PNG, WebP, TIFF, BMP)');
      return;
    }
    
    setSelectedFiles(prev => [...prev, ...imageFiles]);
    toast.success(`Added ${imageFiles.length} image(s) for analysis`);
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const analyzeBatchImages = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setAnalysisResults([]);

    try {
      const formData = new FormData();
      
      // Add images
      selectedFiles.forEach(file => {
        formData.append('images', file);
      });

      // Add analysis options
      Object.entries(analysisOptions).forEach(([key, value]) => {
        formData.append(key, value.toString());
      });

      const response = await fetch(buildApiUrl('api/advanced/analyze-batch'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                toast.error(`Error analyzing ${data.currentFile}: ${data.error}`);
              } else if (data.result) {
                setProgress(data.percentage);
                setCurrentFile(data.currentFile);
                setAnalysisResults(prev => [...prev, data.result]);
              } else if (data.completed) {
                setProgress(100);
                setCurrentFile('');
                toast.success(`Successfully analyzed ${data.totalProcessed} images!`);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }

    } catch (error: any) {
      console.error('Batch analysis error:', error);
      toast.error(error.message || 'Failed to analyze images');
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedFiles, analysisOptions, token]);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-surface-900 mb-4">
          Intelligent Image Analysis
        </h1>
        <p className="text-lg text-surface-600 max-w-3xl mx-auto">
          Get comprehensive insights into your images including color analysis, metadata extraction, 
          quality assessment, and personalized optimization recommendations.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - File Upload & Options */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <PhotoIcon className="w-5 h-5 mr-2 text-primary-600" />
              Upload Images
            </h3>
            
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="secondary"
                className="w-full"
              >
                <PhotoIcon className="w-5 h-5 mr-2" />
                Select Images (Max 10)
              </Button>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-surface-700">
                    Selected Files ({selectedFiles.length})
                  </p>
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-surface-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <PhotoIcon className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-surface-900">{file.name}</p>
                          <p className="text-xs text-surface-500">{formatFileSize(file.size)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="p-1 text-surface-400 hover:text-surface-600 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Analysis Options */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <CogIcon className="w-5 h-5 mr-2 text-primary-600" />
              Analysis Options
            </h3>

            <div className="space-y-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={analysisOptions.extractMetadata}
                  onChange={(e) => setAnalysisOptions(prev => ({ ...prev, extractMetadata: e.target.checked }))}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700">Extract Metadata</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={analysisOptions.analyzeColors}
                  onChange={(e) => setAnalysisOptions(prev => ({ ...prev, analyzeColors: e.target.checked }))}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700">Analyze Colors</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={analysisOptions.assessQuality}
                  onChange={(e) => setAnalysisOptions(prev => ({ ...prev, assessQuality: e.target.checked }))}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700">Assess Quality</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={analysisOptions.generateRecommendations}
                  onChange={(e) => setAnalysisOptions(prev => ({ ...prev, generateRecommendations: e.target.checked }))}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700">Generate Recommendations</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={analysisOptions.detailedAnalysis}
                  onChange={(e) => setAnalysisOptions(prev => ({ ...prev, detailedAnalysis: e.target.checked }))}
                  className="rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-surface-700">Detailed Analysis</span>
              </label>
            </div>
          </div>

          {/* Analysis Controls */}
          <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4 flex items-center">
              <ChartBarIcon className="w-5 h-5 mr-2 text-primary-600" />
              Start Analysis
            </h3>

            <div className="space-y-4">
              <Button
                onClick={analyzeBatchImages}
                variant="primary"
                className="w-full"
                disabled={isAnalyzing || selectedFiles.length === 0}
                loading={isAnalyzing}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Images'}
              </Button>

              {isAnalyzing && (
                <div className="space-y-3">
                  <div className="w-full bg-surface-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-surface-600 text-center">
                    {progress}% Complete
                    {currentFile && ` - Analyzing: ${currentFile}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Analysis Results */}
        <div className="lg:col-span-2 space-y-6">
          {analysisResults.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-12 text-center">
              <ChartBarIcon className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-surface-900 mb-2">No Analysis Results</h3>
              <p className="text-surface-600">
                Upload images and start analysis to see detailed insights and recommendations.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Results Summary */}
              <div className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6">
                <h3 className="text-lg font-semibold text-surface-900 mb-4">
                  Analysis Results ({analysisResults.length} images)
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-surface-50 rounded-lg">
                    <div className="text-2xl font-bold text-primary-600 mb-1">
                      {analysisResults.length}
                    </div>
                    <div className="text-sm text-surface-600">Images Analyzed</div>
                  </div>
                  
                  <div className="text-center p-4 bg-surface-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">
                      {analysisResults.filter(r => !r.error).length}
                    </div>
                    <div className="text-sm text-surface-600">Successful</div>
                  </div>
                  
                  <div className="text-center p-4 bg-surface-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600 mb-1">
                      {analysisResults.filter(r => r.error).length}
                    </div>
                    <div className="text-sm text-surface-600">Errors</div>
                  </div>
                  
                  <div className="text-center p-4 bg-surface-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {analysisResults.reduce((sum, r) => sum + (r.originalSize || 0), 0)}
                    </div>
                    <div className="text-sm text-surface-600">Total Size</div>
                  </div>
                </div>
              </div>

              {/* Individual Results */}
              {analysisResults.map((result, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-soft border border-surface-200 p-6"
                >
                  {result.error ? (
                    <div className="text-center py-8">
                      <h4 className="text-lg font-semibold text-surface-900 mb-2">{result.originalName}</h4>
                      <p className="text-red-600">{result.error}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <div>
                          <h4 className="text-lg font-semibold text-surface-900">{result.originalName}</h4>
                          <p className="text-sm text-surface-500">
                            {formatFileSize(result.originalSize)} • {result.analysis.basic.width}x{result.analysis.basic.height} • {result.analysis.basic.format.toUpperCase()}
                          </p>
                        </div>
                      </div>

                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-3 bg-surface-50 rounded-lg">
                          <div className="text-lg font-bold text-primary-600">
                            {result.analysis.quality.overall.charAt(0).toUpperCase() + result.analysis.quality.overall.slice(1)}
                          </div>
                          <div className="text-xs text-surface-600">Overall Quality</div>
                        </div>
                        
                        <div className="text-center p-3 bg-surface-50 rounded-lg">
                          <div className="text-lg font-bold text-green-600">
                            {result.analysis.size.compressionPotential.toFixed(1)}%
                          </div>
                          <div className="text-xs text-surface-600">Compression Potential</div>
                        </div>
                        
                        <div className="text-center p-3 bg-surface-50 rounded-lg">
                          <div className="text-lg font-bold text-blue-600">
                            {result.analysis.colors.dominant.length}
                          </div>
                          <div className="text-xs text-surface-600">Dominant Colors</div>
                        </div>
                        
                        <div className="text-center p-3 bg-surface-50 rounded-lg">
                          <div className="text-lg font-bold text-purple-600">
                            {result.analysis.recommendations.length}
                          </div>
                          <div className="text-xs text-surface-600">Recommendations</div>
                        </div>
                      </div>

                      {/* Top Recommendations */}
                      {result.analysis.recommendations.length > 0 && (
                        <div>
                          <h5 className="font-medium text-surface-900 mb-3">Top Recommendations</h5>
                          <div className="space-y-2">
                            {result.analysis.recommendations.slice(0, 3).map((rec: any, recIndex: number) => (
                              <div key={recIndex} className="p-3 bg-surface-50 rounded-lg">
                                <h6 className="text-sm font-medium text-surface-900 mb-1">{rec.title}</h6>
                                <p className="text-xs text-surface-600 mb-1">{rec.description}</p>
                                <div className="flex items-center space-x-4 text-xs">
                                  <span className="text-green-600 font-medium">Potential: {rec.potential}</span>
                                  <span className="text-blue-600">{rec.action}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageAnalyzer;
