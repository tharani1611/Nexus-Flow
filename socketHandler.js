const Message = require('../models/Message');

// Track online users: Map<userId, socketId[]>
const onlineUsers = new Map();

module.exports = function(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join core rooms
    socket.on('setup', (data) => {
      const { userId, workspaceIds } = data;
      if (!userId) return;

      socket.userId = userId;

      // Join user specific private room (for DMs and direct notifications)
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined private room user_${userId}`);

      // Add to online tracking
      if (!onlineUsers.has(userId)) {
        onlineUsers.set(userId, []);
      }
      onlineUsers.get(userId).push(socket.id);

      // Broadcast online status
      io.emit('user_status', { userId, status: 'online' });

      // Join all workspace rooms user belongs to
      if (workspaceIds && Array.isArray(workspaceIds)) {
        workspaceIds.forEach(id => {
          socket.join(`workspace_${id}`);
          console.log(`Socket ${socket.id} joined workspace_${id}`);
        });
      }
    });

    // Handle workspace room joins on the fly
    socket.on('join_workspace', (workspaceId) => {
      if (workspaceId) {
        socket.join(`workspace_${workspaceId}`);
        console.log(`Socket ${socket.id} joined workspace_${workspaceId}`);
      }
    });

    // Handle project room joins on the fly
    socket.on('join_project', (projectId) => {
      if (projectId) {
        socket.join(`project_${projectId}`);
        console.log(`Socket ${socket.id} joined project_${projectId}`);
      }
    });

    // Kanban drag and drop sync
    socket.on('task_moved', (data) => {
      const { taskId, project, workspace, sourceStatus, targetStatus } = data;
      // Broadcast to other members in the workspace/project room
      socket.to(`workspace_${workspace}`).emit('task_moved_update', data);
      console.log(`Task ${taskId} moved in project ${project} from ${sourceStatus} to ${targetStatus}`);
    });

    // Team Chat: Typing indicators
    socket.on('typing', (data) => {
      const { workspaceId, projectId, recipientId, userName } = data;
      if (projectId) {
        socket.to(`project_${projectId}`).emit('typing_update', { projectId, userName, isTyping: true });
      } else if (workspaceId) {
        socket.to(`workspace_${workspaceId}`).emit('typing_update', { workspaceId, userName, isTyping: true });
      } else if (recipientId) {
        socket.to(`user_${recipientId}`).emit('typing_update', { senderId: socket.userId, userName, isTyping: true });
      }
    });

    socket.on('stop_typing', (data) => {
      const { workspaceId, projectId, recipientId } = data;
      if (projectId) {
        socket.to(`project_${projectId}`).emit('typing_update', { projectId, isTyping: false });
      } else if (workspaceId) {
        socket.to(`workspace_${workspaceId}`).emit('typing_update', { workspaceId, isTyping: false });
      } else if (recipientId) {
        socket.to(`user_${recipientId}`).emit('typing_update', { senderId: socket.userId, isTyping: false });
      }
    });

    // Team Chat: Send Message
    socket.on('send_message', async (data) => {
      const { chatType, targetId, content } = data;
      try {
        const message = new Message({
          sender: socket.userId,
          chatType,
          targetId,
          content
        });

        await message.save();

        const populated = await Message.findById(message._id)
          .populate('sender', 'name email avatar');

        // Broadcast based on chat type
        if (chatType === 'Workspace') {
          io.to(`workspace_${targetId}`).emit('message_received', populated);
        } else if (chatType === 'Project') {
          io.to(`project_${targetId}`).emit('message_received', populated);
        } else if (chatType === 'Direct') {
          // Send to recipient
          io.to(`user_${targetId}`).emit('message_received', populated);
          // Send back to sender's other sockets
          io.to(`user_${socket.userId}`).emit('message_received', populated);
        }
      } catch (err) {
        console.error('Failed to process socket message:', err);
      }
    });

    // Realtime notifications dispatcher
    socket.on('new_notification', (data) => {
      const { recipientId, notification } = data;
      if (recipientId) {
        io.to(`user_${recipientId}`).emit('notification_received', notification);
      }
    });

    // Video Meeting signaling
    socket.on('join_meeting', (data) => {
      const { roomName, userName, audioActive, videoActive } = data;
      socket.join(`meeting_${roomName}`);
      socket.meetingRoom = roomName;
      socket.userName = userName;

      // Broadcast to other users in meeting room
      socket.to(`meeting_${roomName}`).emit('user_joined_meeting', {
        socketId: socket.id,
        userId: socket.userId,
        userName,
        audioActive,
        videoActive
      });

      console.log(`User ${userName} joined meeting ${roomName}`);
    });

    socket.on('meeting_media_toggle', (data) => {
      const { roomName, audioActive, videoActive } = data;
      socket.to(`meeting_${roomName}`).emit('user_media_updated', {
        socketId: socket.id,
        audioActive,
        videoActive
      });
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      const userId = socket.userId;
      if (userId && onlineUsers.has(userId)) {
        const sockets = onlineUsers.get(userId);
        const filtered = sockets.filter(id => id !== socket.id);
        
        if (filtered.length === 0) {
          onlineUsers.delete(userId);
          // Broadcast offline status
          io.emit('user_status', { userId, status: 'offline' });
        } else {
          onlineUsers.set(userId, filtered);
        }
      }

      // If they were in a meeting, notify others
      if (socket.meetingRoom) {
        socket.to(`meeting_${socket.meetingRoom}`).emit('user_left_meeting', {
          socketId: socket.id,
          userName: socket.userName
        });
      }
    });
  });
};
