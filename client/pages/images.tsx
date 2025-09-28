import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ArrowUpTrayIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import Layout from '@/components/Layout';
import Button from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { formatBytes, formatDate, buildApiUrl } from '@/utils/formatters';
import toast from 'react-hot-toast';
import { useRouter } from 'next/router';

interface ImageDimensions {
  original?: { width?: number; height?: number } | null;
  optimized?: { width?: number; height?: number } | null;
}

interface ImageData {
  id: string;
  originalName: string;
  originalSize: number;
  optimizedSize: number;
  compressionRatio: number;
  format: string;
  dimensions?: ImageDimensions | null;
  dimensionsText?: string;
  createdAt: string;
  expiresAt?: string;
  downloadUrl?: string;
  status: string;
}

const isExpired = (expiresAt?: string) => (expiresAt ? new Date(expiresAt).getTime() < Date.now() : false);

const formatCountdown = (expiresAt?: string, nowMs?: number) => {
  if (!expiresAt) return '';
  const now = typeof nowMs === 'number' ? nowMs : Date.now();
  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) return 'Expired';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `${h}h ${m}m`;
};

export default function Images() {
  const router = useRouter();
  const { user, token, isAuthenticated, isLoading, checkAuth, hasRehydrated } = useAuthStore();
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [now, setNow] = useState(Date.now());

  // Compression form state
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [compressionError, setCompressionError] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [format, setFormat] = useState('auto');
  const [preserveMetadata, setPreserveMetadata] = useState(false);

  useEffect(() => {
    (async () => {
      if (!hasRehydrated) return;
      if (!token) {
        router.replace('/login');
        return;
      }
      await checkAuth();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, hasRehydrated]);

  // Fallback: Force rehydration after 2 seconds if still not rehydrated
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasRehydrated) {
        console.log('Forcing rehydration after timeout');
        // Force rehydration by updating the store
        const authData = localStorage.getItem('pixelsqueeze-auth');
        if (authData) {
          try {
            const parsed = JSON.parse(authData);
            if (parsed.state) {
              // Manually set the rehydrated state
              useAuthStore.setState({ hasRehydrated: true });
            }
          } catch (error) {
            console.error('Error parsing auth data:', error);
            useAuthStore.setState({ hasRehydrated: true });
          }
        } else {
          useAuthStore.setState({ hasRehydrated: true });
        }
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasRehydrated]);

  // Re-render every minute to update countdowns
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Fetch user's images
  useEffect(() => {
    const fetchImages = async () => {
      if (!isAuthenticated || !hasRehydrated) return;

      try {
        const authData = localStorage.getItem('pixelsqueeze-auth');
        const token = authData ? JSON.parse(authData).state.token : '';
        
        if (!token) {
          throw new Error('No authentication token');
        }

        const headers = {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        };

        const response = await fetch(buildApiUrl(`/api/images?page=${page}&limit=20`), {
          headers
        });

        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }

        const data = await response.json();
        const newImages: ImageData[] = data.data.images.map((img: any) => {
          const dims: ImageDimensions | null = img.dimensions || null;
          const dimsText = dims?.optimized?.width && dims?.optimized?.height
            ? `${dims.optimized.width}x${dims.optimized.height}`
            : dims?.original?.width && dims?.original?.height
              ? `${dims.original.width}x${dims.original.height}`
              : '-';
          return {
            id: img._id,
            originalName: img.originalName,
            originalSize: img.originalSize,
            optimizedSize: img.optimizedSize,
            compressionRatio: img.compressionRatio,
            format: img.format,
            dimensions: dims,
            dimensionsText: dimsText,
            createdAt: img.createdAt,
            expiresAt: img.expiresAt,
            downloadUrl: img.downloadUrl,
            status: img.status
          };
        });

        if (page === 1) {
          setImages(newImages);
        } else {
          setImages(prev => [...prev, ...newImages]);
        }

        setHasMore(data.data.pagination.page < data.data.pagination.pages);
      } catch (error) {
        console.error('Error fetching images:', error);
        toast.error('Failed to fetch images');
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [isAuthenticated, page, hasRehydrated, now]); // Added 'now' as dependency to trigger refresh

  // Handle loading and authentication states
  if (!hasRehydrated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!token) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Please Log In</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view and manage your images.</p>
            <Button
              variant="primary"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Checking session...</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <PhotoIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
            <p className="text-gray-600 mb-6">Your session has expired. Please log in again.</p>
            <Button
              variant="primary"
              onClick={() => router.push('/login')}
            >
              Log In Again
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const filteredImages = images.filter(image => {
    const matchesSearch = image.originalName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = selectedFormat === 'all' || image.format.toLowerCase() === selectedFormat;
    return matchesSearch && matchesFormat;
  });

  const sortedImages = [...filteredImages].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.originalName.localeCompare(b.originalName);
      case 'size':
        return b.originalSize - a.originalSize;
      case 'compression':
        return b.compressionRatio - a.compressionRatio;
      case 'date':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    );
  };

  const handleSelectAll = () => {
    setSelectedImages(prev => 
      prev.length === sortedImages.length 
        ? [] 
        : sortedImages.map(img => img.id)
    );
  };

  const handleDownloadSelected = async () => {
    if (selectedImages.length === 0) return;

    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      if (!token) throw new Error('No authentication token');

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002';
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');

      // Stream zip download directly
      const formRes = await fetch(`${cleanBaseUrl}/api/download-batch`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ imageIds: selectedImages })
      });

      if (formRes.ok && formRes.headers.get('Content-Type')?.includes('application/zip')) {
        const blob = await formRes.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'images.zip';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        toast.success('Downloading ZIP');
      } else {
        // Fallback: show message
        toast.error('Failed to create ZIP');
      }
    } catch (error) {
      console.error('Batch download error:', error);
      toast.error('Failed to download');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedImages.length === 0) return;
    if (!confirm(`Delete ${selectedImages.length} image(s)? This cannot be undone.`)) return;

    try {
      const authData = localStorage.getItem('pixelsqueeze-auth');
      const token = authData ? JSON.parse(authData).state.token : '';
      if (!token) throw new Error('No authentication token');

      const headers = { 'Authorization': `Bearer ${token}` };

      await Promise.all(selectedImages.map(async (id) => {
        const res = await fetch(buildApiUrl(`/api/images/${id}`), {
          method: 'DELETE',
          headers,
        });
        if (!res.ok) throw new Error('Failed to delete');
      }));

      setImages(prev => prev.filter(img => !selectedImages.includes(img.id)));
      setSelectedImages([]);
      toast.success('Deleted successfully');
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete images');
    }
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      setPage(prev => prev + 1);
    }
  };

  // File upload handler
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setCompressionError(null);
    
    // Validate file count
    if (files.length > 10) {
      setCompressionError('Maximum 10 images allowed');
      return;
    }

    // Validate file types
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    const invalidFiles = files.filter(file => !validTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      setCompressionError(`Invalid file type(s): ${invalidFiles.map(f => f.name).join(', ')}. Only JPEG, PNG, and WebP are supported.`);
      return;
    }

    // Validate file sizes (max 10MB per file)
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter(file => file.size > maxSize);
    
    if (oversizedFiles.length > 0) {
      setCompressionError(`File(s) too large: ${oversizedFiles.map(f => f.name).join(', ')}. Maximum size is 10MB per file.`);
      return;
    }

    setUploadedFiles(files);
  };

  // Process images function
  const processImages = async () => {
    if (uploadedFiles.length === 0) return;
    
    setIsProcessing(true);
    setCompressionError(null);
    
    try {
      const processedResults = [];
      
      // Process images one by one for better UX
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        
        try {
          const formData = new FormData();
          formData.append('image', file);
          formData.append('quality', quality.toString());
          formData.append('format', format);
          formData.append('preserveMetadata', preserveMetadata.toString());

          const response = await fetch(buildApiUrl('/api/optimize'), {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });

          if (response.ok) {
            const data = await response.json();
            processedResults.push({
              name: file.name,
              originalSize: file.size,
              optimizedSize: data.data.optimizedSize,
              compression: Math.round(data.data.compressionRatio),
              format: data.data.format.toUpperCase(),
              downloadUrl: data.data.downloadUrl
            });
            
            toast.success(`${file.name} compressed successfully!`);
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Compression failed');
          }
        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          toast.error(`Failed to compress ${file.name}`);
        }
      }

      // Refresh images list after successful processing
      if (processedResults.length > 0) {
        setImages([]); // Clear current images
        setPage(1); // Reset to first page
        // Trigger refetch by updating a dependency
        setNow(Date.now());
        toast.success(`${processedResults.length} image(s) compressed successfully!`);
      }

    } catch (error) {
      console.error('Compression error:', error);
      setCompressionError('Failed to process images. Please try again.');
    } finally {
      setIsProcessing(false);
      setUploadedFiles([]);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Images</h1>
          <p className="mt-2 text-gray-600">
            Manage and organize your optimized images
          </p>
        </div>

        {/* Image Compression Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <SparklesIcon className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Compress New Images</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Images
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <ArrowUpTrayIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, WebP up to 10MB each (max 10 files)
                    </p>
                  </label>
                </div>
                
                {uploadedFiles.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Selected Files ({uploadedFiles.length}):
                    </p>
                    <div className="space-y-1">
                      {uploadedFiles.map((file, index) => (
                        <div key={index} className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded">
                          <span className="truncate">{file.name}</span>
                          <span>{formatBytes(file.size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {compressionError && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{compressionError}</p>
                  </div>
                )}
              </div>

              {/* Compression Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compression Settings
                </label>
                
                <div className="space-y-4">
                  {/* Quality Slider */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Quality: {quality}%
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      value={quality}
                      onChange={(e) => setQuality(parseInt(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>Smaller file</span>
                      <span>Better quality</span>
                    </div>
                  </div>

                  {/* Format Selection */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Output Format
                    </label>
                    <select
                      value={format}
                      onChange={(e) => setFormat(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="auto">Auto (Recommended)</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                    </select>
                  </div>

                  {/* Metadata Option */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="preserve-metadata"
                      checked={preserveMetadata}
                      onChange={(e) => setPreserveMetadata(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="preserve-metadata" className="ml-2 text-sm text-gray-600">
                      Preserve metadata (EXIF, etc.)
                    </label>
                  </div>

                  {/* Process Button */}
                  <Button
                    variant="primary"
                    onClick={processImages}
                    disabled={uploadedFiles.length === 0 || isProcessing}
                    className="w-full"
                  >
                    {isProcessing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <SparklesIcon className="h-4 w-4 mr-2" />
                        Compress Images
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <PhotoIcon className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Images</p>
                  <p className="text-2xl font-bold text-gray-900">{images.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Space Saved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatBytes(images.reduce((acc, img) => acc + (img.originalSize - img.optimizedSize), 0))}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <EyeIcon className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Avg. Compression</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {images.length ? Math.round(images.reduce((acc, img) => acc + img.compressionRatio, 0) / images.length) : 0}%
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <CalendarIcon className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {images.filter(img => new Date(img.createdAt).getMonth() === new Date().getMonth()).length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search images..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Formats</option>
                  <option value="jpeg">JPEG</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="date">Sort by Date</option>
                  <option value="name">Sort by Name</option>
                  <option value="size">Sort by Size</option>
                  <option value="compression">Sort by Compression</option>
                </select>
              </div>

              {/* Bulk Actions */}
                  {selectedImages.length > 0 && (
                    <div className="flex space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleDownloadSelected}
                      >
                        <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                        Download ({selectedImages.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteSelected}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={async () => {
                          try {
                            const authData = localStorage.getItem('pixelsqueeze-auth');
                            const token = authData ? JSON.parse(authData).state.token : '';
                            if (!token) throw new Error('No authentication token');
                            const res = await fetch(buildApiUrl('/api/images/extend-expiry'), {
                              method: 'POST',
                              headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                              },
                              body: JSON.stringify({ imageIds: selectedImages, hours: 24 })
                            });
                            if (!res.ok) throw new Error('Failed to extend');
                            toast.success('Extended expiry for selected');
                          } catch (e) {
                            toast.error('Failed to extend expiry');
                          }
                        }}
                      >
                        Extend 24h
                      </Button>
                    </div>
                  )}
            </div>
          </div>
        </motion.div>

        {/* Images Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {loading && page === 1 ? (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loading images...</h3>
              <p className="text-gray-500">
                Fetching your images from the server.
              </p>
            </div>
          ) : sortedImages.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedFormat !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload and compress images using the form above to see them here'
                }
              </p>
              {!searchTerm && selectedFormat === 'all' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-sm text-blue-800">
                    💡 <strong>Tip:</strong> Use the compression form above to upload and optimize your images. They&apos;ll appear here once processed!
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedImages.map((image, index) => (
                <motion.div
                  key={image.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className={`bg-white rounded-lg border-2 p-4 cursor-pointer transition-all ${
                    selectedImages.includes(image.id)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  {/* Image Preview */}
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                    {image.downloadUrl ? (
                      <img
                        src={image.downloadUrl}
                        alt={image.originalName}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                          if (nextElement) {
                            nextElement.style.display = 'flex';
                          }
                        }}
                      />
                    ) : null}
                    <div className={`h-full w-full flex items-center justify-center ${image.downloadUrl ? 'hidden' : 'flex'}`}>
                      <PhotoIcon className="h-12 w-12 text-gray-400" />
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 truncate">{image.originalName}</h3>
                    <div className="text-sm text-gray-500 space-y-1">
                      <div className="flex justify-between">
                        <span>Original:</span>
                        <span>{formatBytes(image.originalSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Optimized:</span>
                        <span>{formatBytes(image.optimizedSize)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Compression:</span>
                        <span className="text-green-600 font-medium">{image.compressionRatio}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Format:</span>
                        <span>{image.format}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dimensions:</span>
                        <span>{image.dimensionsText || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{formatDate(new Date(image.createdAt))}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${image.status === 'completed' ? 'bg-green-100 text-green-700' : image.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {isExpired(image.expiresAt) ? 'expired' : image.status}
                      </span>
                      {image.status === 'completed' && (
                        <span className="text-xs text-gray-500">{formatCountdown(image.expiresAt, now)}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedImages.includes(image.id)}
                        onChange={() => handleImageSelect(image.id)}
                      />
                      <span className="text-sm text-gray-600">Select</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {image.downloadUrl && (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={isExpired(image.expiresAt)}
                            onClick={async () => {
                              if (isExpired(image.expiresAt)) return;
                              try {
                                const authData = localStorage.getItem('pixelsqueeze-auth');
                                const token = authData ? JSON.parse(authData).state.token : '';
                                if (!token) throw new Error('No authentication token');

                                const res = await fetch(buildApiUrl(`/api/download/${image.id}`), {
                                  method: 'GET',
                                  headers: { 'Authorization': `Bearer ${token}` }
                                });

                                if (!res.ok) {
                                  const errText = await res.text();
                                  throw new Error(errText || 'Failed to download');
                                }

                                const blob = await res.blob();
                                const url = window.URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = `optimized_${image.originalName}`;
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                window.URL.revokeObjectURL(url);
                              } catch (e) {
                                console.error(e);
                                toast.error('Download failed');
                              }
                            }}
                          >
                            <ArrowDownTrayIcon className="h-4 w-4 mr-1" /> Download
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              try {
                                const authData = localStorage.getItem('pixelsqueeze-auth');
                                const token = authData ? JSON.parse(authData).state.token : '';
                                if (!token) throw new Error('No authentication token');
                                const res = await fetch(buildApiUrl(`/api/images/${image.id}/extend-expiry`), {
                                  method: 'POST',
                                  headers: {
                                    'Authorization': `Bearer ${token}`,
                                    'Content-Type': 'application/json'
                                  },
                                  body: JSON.stringify({ hours: 24 })
                                });
                                if (!res.ok) throw new Error('Failed to extend');
                                toast.success('Expiry extended by 24h');
                              } catch (e) {
                                toast.error('Failed to extend expiry');
                              }
                            }}
                          >
                            Extend 24h
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Select All */}
        {sortedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-6 text-center"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedImages.length === sortedImages.length ? 'Deselect All' : 'Select All'}
            </Button>
          </motion.div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={loadMore} disabled={loading}>
              {loading ? 'Loading...' : 'Load more'}
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
} 