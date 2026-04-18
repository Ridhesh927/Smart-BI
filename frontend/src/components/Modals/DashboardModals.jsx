import React, { useState } from 'react';
import { Dialog, DialogActions, DialogButton } from '../Shared/Dialog';

export function RenameModal({ isOpen, onClose, currentTitle, onRename }) {
  const [newTitle, setNewTitle] = useState(currentTitle || '');

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (newTitle && newTitle !== currentTitle) {
      onRename(newTitle);
    }
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="localhost:5173 says">
      <div className="space-y-4">
        <p className="text-sm text-white/90 font-medium">Enter new dashboard name:</p>
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-transparent border-2 border-[#ffa48e]/30 focus:border-[#ffa48e] rounded-2xl px-4 py-3 text-white outline-none transition-all"
            spellCheck={false}
          />
          <DialogActions>
            <DialogButton onClick={handleSubmit}>OK</DialogButton>
            <DialogButton variant="secondary" onClick={onClose}>Cancel</DialogButton>
          </DialogActions>
        </form>
      </div>
    </Dialog>
  );
}

export function DeleteModal({ isOpen, onClose, onDelete, message }) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="localhost:5173 says">
      <p className="text-sm text-white/90 font-medium mb-2">
        {message || "Are you sure you want to delete this dashboard?"}
      </p>
      <DialogActions>
        <DialogButton onClick={() => { onDelete(); onClose(); }}>OK</DialogButton>
        <DialogButton variant="secondary" onClick={onClose}>Cancel</DialogButton>
      </DialogActions>
    </Dialog>
  );
}

export function SuccessModal({ isOpen, onClose, message }) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="localhost:5173 says">
      <p className="text-sm text-white/90 font-medium mb-2">
        {message || "Dashboard saved safely!"}
      </p>
      <DialogActions>
        <DialogButton onClick={onClose}>OK</DialogButton>
      </DialogActions>
    </Dialog>
  );
}
