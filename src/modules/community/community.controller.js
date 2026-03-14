const communityService = require('./community.service');

exports.createCommunity = async (req, res) => {
    try {
        const { name, description, avatar } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Community name is required' });
        }

        const community = await communityService.createCommunity(req.userId, name, description, avatar);
        res.status(201).json(community);
    } catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUserCommunities = async (req, res) => {
    try {
        const communities = await communityService.getUserCommunities(req.userId);
        res.json(communities);
    } catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getCommunityById = async (req, res) => {
    try {
        const community = await communityService.getCommunityById(req.params.id, req.userId);
        res.json(community);
    } catch (error) {
        if (error.message.includes('not found')) {
            return res.status(404).json({ message: error.message });
        }
        console.error('Error fetching community details:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.deleteCommunity = async (req, res) => {
    try {
        await communityService.deleteCommunity(req.params.id, req.userId);
        res.json({ message: 'Community deleted successfully' });
    } catch (error) {
        if (error.message.includes('Only the owner')) {
            return res.status(403).json({ message: error.message });
        }
        console.error('Error deleting community:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
