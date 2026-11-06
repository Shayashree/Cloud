export default function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">🎉</span>
        <p>No tasks here! Add one above.</p>
      </div>
    );
  }

  return (
    <ul className="task-list" aria-label="Task list">
      {tasks.map((task) => (
        <li
          key={task._id}
          className={`task-card ${task.completed ? 'completed' : ''}`}
        >
          <button
            id={`toggle-${task._id}`}
            className="check-btn"
            onClick={() => onToggle(task._id)}
            aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
          >
            <span className="check-icon">{task.completed ? '✔' : ''}</span>
          </button>

          <div className="task-body">
            <p className="task-title">{task.title}</p>
            {task.description && (
              <p className="task-desc">{task.description}</p>
            )}
            <p className="task-date">
              {new Date(task.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>

          <button
            id={`delete-${task._id}`}
            className="delete-btn"
            onClick={() => onDelete(task._id)}
            aria-label="Delete task"
          >
            ✕
          </button>
        </li>
      ))}
    </ul>
  );
}
