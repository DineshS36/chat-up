const backupService = require('./backup.service');

exports.exportChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const format = req.query.format || 'json';

        if (format === 'json') {
            const data = await backupService.getBackupJSON(chatId, req.userId);
            res.setHeader('Content-disposition', `attachment; filename=chat-backup-${chatId}.json`);
            res.setHeader('Content-type', 'application/json');
            return res.send(JSON.stringify(data, null, 2));
        }

        if (format === 'txt') {
            const data = await backupService.getBackupTXT(chatId, req.userId);
            res.setHeader('Content-disposition', `attachment; filename=chat-backup-${chatId}.txt`);
            res.setHeader('Content-type', 'text/plain');
            return res.send(data);
        }

        return res.status(400).json({ message: 'Unsupported format requested' });

    } catch (error) {
        if (error.message.includes('Access denied')) {
            return res.status(403).json({ message: error.message });
        }
        console.error('Error generating backup:', error);
        res.status(500).json({ message: 'Server error generating export' });
    }
};
