const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Image Preprocessing Service
 * Enhances image quality for better OCR accuracy
 */
class ImagePreprocessService {
  /**
   * Preprocess image for optimal OCR results
   * @param {string} inputPath - Path to input image
   * @param {Object} options - Preprocessing options
   * @returns {Promise<string>} Path to preprocessed image
   */
  async preprocessForOCR(inputPath, options = {}) {
    try {
      const {
        enhanceContrast = true,
        sharpen = true,
        denoise = false,
        dpi = 300,
        outputFormat = 'png',
      } = options;

      // Create temp directory if it doesn't exist
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Generate output filename
      const timestamp = Date.now();
      const outputFilename = `preprocessed_${timestamp}.${outputFormat}`;
      const outputPath = path.join(tempDir, outputFilename);

      console.log('🔄 Starting image preprocessing...');

      // Start sharp pipeline
      let pipeline = sharp(inputPath);

      // Get metadata
      const metadata = await pipeline.metadata();
      console.log(`   Original: ${metadata.width}x${metadata.height}, ${metadata.format}, ${metadata.space}`);

      // Resize if DPI is specified and we can calculate it
      // For better OCR, ensure minimum resolution
      if (metadata.width < 2000) {
        const scaleFactor = 2000 / metadata.width;
        pipeline = pipeline.resize({
          width: Math.round(metadata.width * scaleFactor),
          height: Math.round(metadata.height * scaleFactor),
          kernel: sharp.kernel.lanczos3,
          fit: 'inside',
        });
        console.log('   ✓ Upscaling image for better resolution');
      }

      // Convert to grayscale (significantly improves OCR accuracy)
      pipeline = pipeline.grayscale();
      console.log('   ✓ Converting to grayscale');

      // Normalize (auto-adjust brightness and contrast)
      pipeline = pipeline.normalize();
      console.log('   ✓ Normalizing brightness/contrast');

      // Enhance contrast if enabled
      if (enhanceContrast) {
        pipeline = pipeline.linear(1.2, -(128 * 1.2) + 128); // Increase contrast
        console.log('   ✓ Enhancing contrast');
      }

      // Apply slight sharpening to improve text clarity
      if (sharpen) {
        pipeline = pipeline.sharpen({ sigma: 1.5 });
        console.log('   ✓ Sharpening text');
      }

      // Denoise (optional - can help with noisy images but may blur text)
      if (denoise) {
        pipeline = pipeline.median(3);
        console.log('   ✓ Reducing noise');
      }

      // Apply threshold for better text separation (adaptive thresholding)
      // This converts to pure black and white which Tesseract loves
      pipeline = pipeline.threshold(128, { grayscale: false });
      console.log('   ✓ Applying threshold');

      // Output as PNG with maximum quality (lossless)
      await pipeline
        .png({ 
          quality: 100, 
          compressionLevel: 0, // No compression for best quality
          adaptiveFiltering: false,
        })
        .toFile(outputPath);

      const outputStats = fs.statSync(outputPath);
      console.log(`✅ Preprocessing complete: ${outputPath}`);
      console.log(`   Output size: ${(outputStats.size / 1024).toFixed(2)} KB`);

      return outputPath;
    } catch (error) {
      console.error('❌ Image preprocessing error:', error);
      throw new Error(`Failed to preprocess image: ${error.message}`);
    }
  }

  /**
   * Preprocess image with lighter processing (for already good quality images)
   * @param {string} inputPath - Path to input image
   * @returns {Promise<string>} Path to preprocessed image
   */
  async lightPreprocess(inputPath) {
    return this.preprocessForOCR(inputPath, {
      enhanceContrast: false,
      sharpen: true,
      denoise: false,
      dpi: 300,
    });
  }

  /**
   * Aggressive preprocessing for low-quality or noisy images
   * @param {string} inputPath - Path to input image
   * @returns {Promise<string>} Path to preprocessed image
   */
  async aggressivePreprocess(inputPath) {
    return this.preprocessForOCR(inputPath, {
      enhanceContrast: true,
      sharpen: true,
      denoise: true,
      dpi: 400,
    });
  }

  /**
   * Check if image needs preprocessing based on quality metrics
   * @param {string} imagePath - Path to image
   * @returns {Promise<Object>} Quality metrics and recommendation
   */
  async analyzeImageQuality(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      
      const quality = {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        hasAlpha: metadata.hasAlpha,
        colorSpace: metadata.space,
        isColor: metadata.space !== 'b-w' && metadata.space !== 'grey',
        resolution: metadata.width * metadata.height,
      };

      // Determine if preprocessing is needed
      quality.needsPreprocessing = 
        quality.width < 1500 || // Low resolution
        quality.isColor || // Color image (grayscale is better for OCR)
        quality.format === 'jpeg'; // JPEG has compression artifacts

      quality.recommendedLevel = quality.width < 1000 ? 'aggressive' : 
                                  quality.isColor ? 'standard' : 
                                  'light';

      return quality;
    } catch (error) {
      console.error('Error analyzing image quality:', error);
      return { needsPreprocessing: true, recommendedLevel: 'standard' };
    }
  }

  /**
   * Clean up temporary preprocessed files
   * @param {string} filePath - Path to file to delete
   */
  cleanupTempFile(filePath) {
    try {
      if (filePath && fs.existsSync(filePath)) {
        // Only delete files in temp directory
        if (filePath.includes('/temp/') || filePath.includes('\\temp\\')) {
          fs.unlinkSync(filePath);
          console.log(`🗑️  Cleaned up temp file: ${path.basename(filePath)}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up temp file:', error.message);
    }
  }

  /**
   * Clean up all old temporary files (older than 1 hour)
   */
  cleanupOldTempFiles() {
    try {
      const tempDir = path.join(__dirname, '../temp');
      if (!fs.existsSync(tempDir)) return;

      const files = fs.readdirSync(tempDir);
      const oneHourAgo = Date.now() - (60 * 60 * 1000);

      let cleaned = 0;
      files.forEach(file => {
        const filePath = path.join(tempDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtimeMs < oneHourAgo) {
          fs.unlinkSync(filePath);
          cleaned++;
        }
      });

      if (cleaned > 0) {
        console.log(`🗑️  Cleaned up ${cleaned} old temp files`);
      }
    } catch (error) {
      console.error('Error during temp file cleanup:', error.message);
    }
  }
}

module.exports = new ImagePreprocessService();
