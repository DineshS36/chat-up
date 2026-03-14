const inviteService = require('./invite.service');

exports.createInvite = async (req, res) => {
    try {
        const { communityId, maxUses, expiresInDays } = req.body;

        if (!communityId) {
            return res.status(400).json({ message: 'communityId is required' });
        }

        const invite = await inviteService.generateInvite(communityId, req.userId, maxUses, expiresInDays);
        res.status(201).json(invite);
    } catch (error) {
        console.error('Error generating invite:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.validateInvite = async (req, res) => {
    try {
        const invite = await inviteService.getInviteByCode(req.params.code);
        res.json(invite);
    } catch (error) {
        res.status(404).json({ message: error.message });
    }
};

exports.joinViaInvite = async (req, res) => {
    try {
        const community = await inviteService.consumeInvite(req.params.code, req.userId);
        res.json({ message: 'Successfully joined!', community });
    } catch (error) {
        if (error.message.includes('already a member')) {
            return res.status(409).json({ message: error.message });
        }
        res.status(400).json({ message: error.message });
    }
};
