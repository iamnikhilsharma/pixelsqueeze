const cron = require('node-cron');
const Image = require('../models/Image');
const storageService = require('./storageService');
const { logger } = require('../utils/logger');

function startCleanupJob() {
  // Run at minute 5 every hour
  cron.schedule('5 * * * *', async () => {
    try {
      const expiredImages = await Image.findExpired();
      if (!expiredImages.length) {
        logger.info('Cleanup: no expired images found');
        return;
      }

      const keys = expiredImages
        .map(img => img.storage && img.storage.optimizedKey)
        .filter(Boolean);

      if (keys.length) {
        await storageService.deleteMultipleFiles(keys);
      }

      const ids = expiredImages.map(img => img._id);
      await Image.deleteMany({ _id: { $in: ids } });

      logger.info(`Cleanup: deleted ${expiredImages.length} expired images`);
    } catch (error) {
      logger.error('Cleanup job error:', error);
    }
  });

  logger.info('Cleanup job scheduled: hourly at minute 5');
}

module.exports = { startCleanupJob };