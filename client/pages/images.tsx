import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  PhotoIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { Layout } from '@/components/Layout';
import { Button } from '@/components/Button';
import { useAuthStore } from '@/store/authStore';
import { formatBytes, formatDate } from '@/utils/formatters';

// Mock data for demonstration
const mockImages = [
  {
    id: '1',
    name: 'hero-image.jpg',
    originalSize: 2048576,
    optimizedSize: 512000,
    compressionRatio: 75,
    format: 'JPEG',
    dimensions: '1920x1080',
    createdAt: new Date('2024-01-15'),
    downloadUrl: '/uploads/optimized_1.jpg'
  },
  {
    id: '2',
    name: 'logo.png',
    originalSize: 512000,
    optimizedSize: 128000,
    compressionRatio: 75,
    format: 'PNG',
    dimensions: '800x600',
    createdAt: new Date('2024-01-14'),
    downloadUrl: '/uploads/optimized_2.jpg'
  },
  {
    id: '3',
    name: 'banner.webp',
    originalSize: 1024000,
    optimizedSize: 256000,
    compressionRatio: 75,
    format: 'WebP',
    dimensions: '1200x400',
    createdAt: new Date('2024-01-13'),
    downloadUrl: '/uploads/optimized_3.jpg'
  }
];

export default function Images() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);

  const filteredImages = mockImages.filter(image => {
    const matchesSearch = image.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFormat = selectedFormat === 'all' || image.format.toLowerCase() === selectedFormat;
    return matchesSearch && matchesFormat;
  });

  const sortedImages = [...filteredImages].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'size':
        return b.originalSize - a.originalSize;
      case 'compression':
        return b.compressionRatio - a.compressionRatio;
      case 'date':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
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

  const handleDownloadSelected = () => {
    // TODO: Implement batch download
    alert(`Downloading ${selectedImages.length} images...`);
  };

  const handleDeleteSelected = () => {
    if (confirm(`Are you sure you want to delete ${selectedImages.length} images?`)) {
      // TODO: Implement delete
      alert('Delete functionality coming soon!');
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
                  <p className="text-2xl font-bold text-gray-900">{mockImages.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center">
                <ArrowDownTrayIcon className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Space Saved</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatBytes(mockImages.reduce((acc, img) => acc + (img.originalSize - img.optimizedSize), 0))}
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
                    {Math.round(mockImages.reduce((acc, img) => acc + img.compressionRatio, 0) / mockImages.length)}%
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
                    {mockImages.filter(img => img.createdAt.getMonth() === new Date().getMonth()).length}
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
          {sortedImages.length === 0 ? (
            <div className="text-center py-12">
              <PhotoIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No images found</h3>
              <p className="text-gray-500">
                {searchTerm || selectedFormat !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Start by uploading some images to see them here'
                }
              </p>
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
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <PhotoIcon className="h-12 w-12 text-gray-400" />
                  </div>

                  {/* Image Info */}
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900 truncate">{image.name}</h3>
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
                        <span>{image.dimensions}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{formatDate(image.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(image.downloadUrl, '_blank');
                      }}
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement view details
                        alert('View details coming soon!');
                      }}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
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
      </div>
    </Layout>
  );
} 