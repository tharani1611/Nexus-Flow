const Workspace = require('../models/Workspace');

module.exports = function(allowedRoles) {
  return async function(req, res, next) {
    try {
      const workspaceId = req.params.workspaceId || 
                          req.headers['x-workspace-id'] || 
                          req.query.workspaceId || 
                          req.body.workspaceId;

      if (!workspaceId) {
        return res.status(400).json({ msg: 'Workspace ID is required for role authorization' });
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ msg: 'Workspace not found' });
      }

      // If the user is the creator, they are automatically allowed all privileges (Super Admin)
      if (workspace.createdBy.toString() === req.user.id) {
        req.workspace = workspace;
        req.userWorkspaceRole = 'Super Admin';
        return next();
      }

      const member = workspace.members.find(
        m => m.user.toString() === req.user.id
      );

      if (!member) {
        return res.status(403).json({ msg: 'Access denied: You are not a member of this workspace' });
      }

      // If allowedRoles is defined and doesn't contain the member's role
      if (allowedRoles && allowedRoles.length > 0) {
        const hasRole = allowedRoles.includes(member.role) || member.role === 'Super Admin';
        if (!hasRole) {
          return res.status(403).json({ msg: `Access denied: Requires role ${allowedRoles.join(' or ')}` });
        }
      }

      req.workspace = workspace;
      req.userWorkspaceRole = member.role;
      next();
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: 'Server error in role verification' });
    }
  };
};
