import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  Slider,
  FormControl,
  FormControlLabel,
  Switch,
  LinearProgress,
  Card,
  CardContent,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';

import {
  CloudUpload,
  CompareArrows,
  Download,
  Refresh,
  Info,
  PictureAsPdf,
} from '@mui/icons-material';

// Import the real compression service and types
import { compressPDF as compressPDFService } from './services/pdfCompressionService';
import { PDFCompressionOptions } from './types/compression';

// Types for our application
interface CompressionOptions {
  quality: number;
  preserveQuality: boolean;
  compressionLevel: 'low' | 'medium' | 'high';
}

interface FileState {
  file: File | null;
  preview: string | null;
  compressedFile: Blob | null;
  compressedPreview: string | null;
  originalSize: number;
  compressedSize: number;
  isProcessing: boolean;
  progress: number;
  error: string | null;
}

function App() {
  // State for file handling
  const [fileState, setFileState] = useState<FileState>({
    file: null,
    preview: null,
    compressedFile: null,
    compressedPreview: null,
    originalSize: 0,
    compressedSize: 0,
    isProcessing: false,
    progress: 0,
    error: null,
  });

  // State for compression options
  const [options, setOptions] = useState<CompressionOptions>({
    quality: 80,
    preserveQuality: true,
    compressionLevel: 'medium',
  });

  // Handle file drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    const file = acceptedFiles[0];
    
    // Validate if it's a PDF
    if (file.type !== 'application/pdf') {
      setFileState(prev => ({
        ...prev,
        error: 'Only PDF files are supported.',
      }));
      return;
    }

    // Reset any previous error
    setFileState(prev => ({
      ...prev,
      error: null,
    }));
    
    // Create a preview URL
    const previewUrl = URL.createObjectURL(file);
    
    setFileState({
      file,
      preview: previewUrl,
      compressedFile: null,
      compressedPreview: null,
      originalSize: file.size,
      compressedSize: 0,
      isProcessing: false,
      progress: 0,
      error: null,
    });
  }, []);

  // Configure dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxFiles: 1,
  });

  // Handle compression options change
  const handleOptionChange = (option: keyof CompressionOptions, value: any) => {
    setOptions(prev => ({
      ...prev,
      [option]: value,
    }));
  };

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (fileState.preview) {
        URL.revokeObjectURL(fileState.preview);
      }
      if (fileState.compressedPreview) {
        URL.revokeObjectURL(fileState.compressedPreview);
      }
    };
  }, [fileState.preview, fileState.compressedPreview]);

  // Compress PDF function - updated to use real compression
  const compressPDF = async () => {
    if (!fileState.file) return;

    try {
      setFileState(prev => ({
        ...prev,
        isProcessing: true,
        progress: 0,
        error: null,
      }));

      // Create compression options based on user settings
      const compressionOptions: PDFCompressionOptions = {
        quality: options.quality,
        compressionLevel: options.compressionLevel,
        preserveQuality: options.preserveQuality,
      };

      // Use the real compression service with progress updates
      const result = await compressPDFService(
        fileState.file,
        compressionOptions,
        (progress, message) => {
          setFileState(prev => ({
            ...prev,
            progress,
          }));
        }
      );

      // Create a preview URL for the compressed PDF
      const compressedPreviewUrl = URL.createObjectURL(result.compressedFile);
      
      // Update state with compression results
      setFileState(prev => ({
        ...prev,
        compressedFile: result.compressedFile,
        compressedPreview: compressedPreviewUrl,
        compressedSize: result.compressedSize,
        isProcessing: false,
        progress: 100,
      }));
      
      // Reset progress after a short delay
      setTimeout(() => {
        setFileState(prev => ({
          ...prev,
          progress: 0,
        }));
      }, 1000);
      
    } catch (error) {
      console.error('Error compressing PDF:', error);
      setFileState(prev => ({
        ...prev,
        isProcessing: false,
        progress: 0,
        error: error instanceof Error ? error.message : 'Failed to compress PDF. Please try again.',
      }));
    }
  };

  // Download the compressed PDF
  const downloadCompressedPDF = () => {
    if (!fileState.compressedFile || !fileState.file) return;
    
    const fileName = fileState.file.name.replace('.pdf', '-compressed.pdf');
    saveAs(fileState.compressedFile, fileName);
  };

  // Reset the application state
  const resetState = () => {
    if (fileState.preview) {
      URL.revokeObjectURL(fileState.preview);
    }
    if (fileState.compressedPreview) {
      URL.revokeObjectURL(fileState.compressedPreview);
    }
    
    setFileState({
      file: null,
      preview: null,
      compressedFile: null,
      compressedPreview: null,
      originalSize: 0,
      compressedSize: 0,
      isProcessing: false,
      progress: 0,
      error: null,
    });
  };

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Calculate compression percentage
  const getCompressionPercentage = (): number => {
    if (!fileState.originalSize || !fileState.compressedSize) return 0;
    return Math.round(100 - (fileState.compressedSize / fileState.originalSize * 100));
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        PDF Compressor
      </Typography>
      
      <Typography variant="subtitle1" gutterBottom align="center" sx={{ mb: 4, color: 'text.secondary' }}>
        Compress your PDF files while preserving quality
      </Typography>
      
      {/* File Drop Zone */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          mb: 4,
          borderRadius: 2,
          backgroundColor: isDragActive ? 'rgba(25, 118, 210, 0.08)' : 'white',
          border: isDragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
          transition: 'all 0.3s ease',
        }}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            py: 4,
          }}
        >
          <CloudUpload sx={{ fontSize: 64, color: isDragActive ? '#1976d2' : '#9e9e9e', mb: 2 }} />
          <Typography variant="h6" align="center" sx={{ mb: 1 }}>
            {isDragActive ? 'Drop your PDF here' : 'Drag & drop your PDF file here'}
          </Typography>
          <Typography variant="body2" align="center" color="text.secondary">
            or click to select a file
          </Typography>
          {fileState.file && (
            <Typography variant="body1" sx={{ mt: 2, fontWeight: 'medium' }}>
              Selected: {fileState.file.name} ({formatFileSize(fileState.originalSize)})
            </Typography>
          )}
        </Box>
      </Paper>
      
      {/* Error Message */}
      {fileState.error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {fileState.error}
        </Alert>
      )}
      
      {/* Compression Options */}
      {fileState.file && !fileState.compressedFile && (
        <Card elevation={2} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Compression Options
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ width: '100%' }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel id="compression-level-label">Compression Level</InputLabel>
                  <Select
                    labelId="compression-level-label"
                    value={options.compressionLevel}
                    label="Compression Level"
                    onChange={(e) => handleOptionChange('compressionLevel', e.target.value)}
                    disabled={fileState.isProcessing}
                  >
                    <MenuItem value="low">Low (Better Quality)</MenuItem>
                    <MenuItem value="medium">Medium (Balanced)</MenuItem>
                    <MenuItem value="high">High (Smaller Size)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography id="quality-slider-label" gutterBottom sx={{ mr: 2 }}>
                    Quality:
                  </Typography>
                  <Slider
                    value={options.quality}
                    min={10}
                    max={100}
                    step={5}
                    valueLabelDisplay="auto"
                    onChange={(_, value) => handleOptionChange('quality', value)}
                    disabled={fileState.isProcessing}
                    sx={{ flexGrow: 1 }}
                  />
                  <Typography sx={{ ml: 2, minWidth: '40px' }}>
                    {options.quality}%
                  </Typography>
                </Box>
              </Box>
              
              <Box sx={{ width: '100%' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={options.preserveQuality}
                      onChange={(e) => handleOptionChange('preserveQuality', e.target.checked)}
                      disabled={fileState.isProcessing}
                    />
                  }
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography>Preserve Text Quality</Typography>
                      <Tooltip title="Ensures text remains sharp and readable even with high compression">
                        <IconButton size="small" sx={{ ml: 1 }}>
                          <Info fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                />
              </Box>
            </Box>
            
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={compressPDF}
                disabled={fileState.isProcessing || !fileState.file}
                startIcon={<CompareArrows />}
                sx={{ px: 4 }}
              >
                {fileState.isProcessing ? 'Compressing...' : 'Compress PDF'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
      
      {/* Progress Bar */}
      {fileState.isProcessing && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Compressing PDF... {fileState.progress}%
          </Typography>
          <LinearProgress variant="determinate" value={fileState.progress} />
        </Box>
      )}
      
      {/* Results */}
      {fileState.compressedFile && (
        <Card elevation={3} sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Compression Results
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
              <Box sx={{ flex: '1 1 45%' }}>
                <Typography variant="body2" color="text.secondary">Original Size</Typography>
                <Typography variant="h6">{formatFileSize(fileState.originalSize)}</Typography>
              </Box>
              <Box sx={{ flex: '1 1 45%' }}>
                <Typography variant="body2" color="text.secondary">Compressed Size</Typography>
                <Typography variant="h6">{formatFileSize(fileState.compressedSize)}</Typography>
              </Box>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                  <PictureAsPdf sx={{ color: 'success.main', mr: 1 }} />
                  <Typography variant="body1" color="success.main" fontWeight="medium">
                    Reduced by {getCompressionPercentage()}% ({formatFileSize(fileState.originalSize - fileState.compressedSize)})
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <Stack direction="row" spacing={2} justifyContent="center">
              <Button
                variant="contained"
                color="primary"
                startIcon={<Download />}
                onClick={downloadCompressedPDF}
              >
                Download Compressed PDF
              </Button>
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={resetState}
              >
                Compress Another PDF
              </Button>
            </Stack>
          </CardContent>
        </Card>
      )}
      
      <Typography variant="body2" align="center" color="text.secondary" sx={{ mt: 4 }}>
        All processing happens in your browser. Your files are never uploaded to any server.
      </Typography>
    </Container>
  );
}

export default App;
