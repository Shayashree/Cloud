import { useState } from 'react';

export default function TaskForm({ onAdd }) {
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [shake, setShake] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setSubmitting(true);
    try {
      await onAdd({ title: title.trim(), description: desc.trim() });
      setTitle('');
      setDesc('');
    } catch {
      // error handled in parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className={`task-form ${shake ? 'shake' : ''}`}
      onSubmit={handleSubmit}
      aria-label="Add new task"
    >
      <div className="form-row">
        <input
          id="task-title-input"
          className="form-input"
          type="text"
          placeholder="Task title *"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={120}
          aria-required="true"
        />
        <button
          id="add-task-btn"
          className="btn-add"
          type="submit"
          disabled={submitting}
          aria-label="Add task"
        >
          {submitting ? '…' : '+ Add'}
        </button>
      </div>
      <textarea
        id="task-desc-input"
        className="form-textarea"
        placeholder="Description (optional)"
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        maxLength={500}
        rows={2}
      />
    </form>
  );
}
