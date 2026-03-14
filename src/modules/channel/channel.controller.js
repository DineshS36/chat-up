const channelService = require('./channel.service');

exports.createChannel = async (req, res) => {
    try {
        const { communityId, name, type } = req.body;

        if (!communityId || !name) {
            return res.status(400).json({ message: 'communityId and name are required' });
        }

        const channel = await channelService.createChannel(communityId, req.userId, name, type);
        res.status(201).json(channel);
    } catch (error) {
        if (error.message.includes('permission')) {
            return res.status(403).json({ message: error.message });
        }
        if (error.message.includes('already exists')) {
            return res.status(409).json({ message: error.message });
        }
        console.error('Error creating channel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getChannels = async (req, res) => {
    try {
        const channels = await channelService.getChannelsByCommunity(req.params.communityId, req.userId);
        res.json(channels);
    } catch (error) {
        if (error.message.includes('denied')) {
            return res.status(403).json({ message: error.message });
        }
        console.error('Error fetching channels:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteChannel = async (req, res) => {
    try {
        await channelService.deleteChannel(req.params.id, req.userId);
        res.json({ message: 'Channel deleted successfully' });
    } catch (error) {
        if (error.message.includes('permission')) {
            return res.status(403).json({ message: error.message });
        }
        console.error('Error deleting channel:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
