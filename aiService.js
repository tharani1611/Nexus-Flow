/**
 * AI Assistant Service for NexusFlow.
 * Simulates an AI helper. Can be extended to connect to Google Gemini, OpenAI, or other APIs.
 */

class AIService {
  /**
   * Generates a descriptive helper template for a task based on its title.
   */
  async generateTaskDescription(title) {
    if (!title) return 'Please provide a task title first.';

    // Check if external API config is available, else use smart mockup
    return `### [AI Generated Description for: ${title}]
    
#### Objective
Implement the requirements for the task: "${title}".

#### Technical Steps
1. Analyze the functional specifications and current database schema.
2. Code the necessary logic in accordance with backend/frontend guidelines.
3. Add robust error handling and log appropriate events in the activity database.
4. Conduct initial unit tests and peer code review.

#### Acceptance Criteria
- [ ] Feature functions cleanly without UI rendering errors.
- [ ] Backend endpoints return correct status codes (e.g. 200 OK, 201 Created).
- [ ] Responsive UI conforms to the application's glassmorphism style rules.`;
  }

  /**
   * Suggests priority based on keyword matching in title and description.
   */
  async suggestPriority(title, description = '') {
    const text = `${title} ${description}`.toLowerCase();
    
    if (text.includes('critical') || text.includes('broken') || text.includes('crash') || text.includes('security') || text.includes('auth')) {
      return 'Urgent';
    } else if (text.includes('bug') || text.includes('error') || text.includes('implement') || text.includes('api')) {
      return 'High';
    } else if (text.includes('refactor') || text.includes('improve') || text.includes('style')) {
      return 'Medium';
    } else {
      return 'Low';
    }
  }

  /**
   * Estimates completion time in hours based on story points and priority.
   */
  async estimateCompletionTime(title, storyPoints = 0, priority = 'Medium') {
    let baseHours = storyPoints > 0 ? storyPoints * 4 : 8; // Default 4 hours per story point
    
    switch (priority) {
      case 'Urgent':
        baseHours = Math.ceil(baseHours * 0.8); // High urgency might imply focused speed
        break;
      case 'High':
        baseHours = Math.ceil(baseHours * 1.0);
        break;
      case 'Medium':
        baseHours = Math.ceil(baseHours * 1.2);
        break;
      case 'Low':
        baseHours = Math.ceil(baseHours * 1.5);
        break;
    }
    
    return `${baseHours} hours`;
  }

  /**
   * Suggests sprint planning allocations.
   */
  async suggestSprintPlanning(tasks, capacity = 20) {
    // Sort tasks by priority and story points
    const priorityWeights = { 'Urgent': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
    
    const sortedTasks = [...tasks].sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 2;
      const weightB = priorityWeights[b.priority] || 2;
      if (weightB !== weightA) return weightB - weightA;
      return (b.storyPoints || 0) - (a.storyPoints || 0);
    });

    const selectedTasks = [];
    let currentPoints = 0;
    const skippedTasks = [];

    for (const task of sortedTasks) {
      const points = task.storyPoints || 1;
      if (currentPoints + points <= capacity) {
        selectedTasks.push(task);
        currentPoints += points;
      } else {
        skippedTasks.push(task);
      }
    }

    return {
      suggestedTasks: selectedTasks,
      totalSuggestedStoryPoints: currentPoints,
      remainingCapacity: capacity - currentPoints,
      backloggedTasks: skippedTasks,
      planningAdvice: `Based on your team capacity of ${capacity} story points, we recommend focusing on high-priority items first. You have allocated ${currentPoints} points, leaving ${capacity - currentPoints} points of spare buffer.`
    };
  }
}

module.exports = new AIService();
