import React, { useState, useRef } from "react";
import "./App.css";

/**
 * NOTES APP MAIN COMPONENT
 * Implements a minimal, light-themed notes app.
 * Features: create, list, select, edit, delete notes. Responsive layout.
 * Color palette: primary (#1976d2), accent (#ffab00), secondary (#424242)
 */

const COLORS = {
  primary: "#1976d2",
  accent: "#ffab00",
  secondary: "#424242",
  bg: "#fff",
  bgSecondary: "#f8f9fa",
  text: "#24292f",
  border: "#e9ecef",
};

const SIDEBAR_MIN_WIDTH = 200;

function usePersistentNotes(initial = []) {
  // For demo, use useState (not persisted). Easily upgraded to localStorage if needed.
  const [notes, setNotes] = useState(initial);

  // PUBLIC_INTERFACE
  function addNote(note) {
    setNotes((old) => [...old, note]);
  }

  // PUBLIC_INTERFACE
  function updateNote(id, updates) {
    setNotes((old) => old.map((n) => (n.id === id ? { ...n, ...updates } : n)));
  }

  // PUBLIC_INTERFACE
  function deleteNote(id) {
    setNotes((old) => old.filter((n) => n.id !== id));
  }

  return { notes, addNote, updateNote, deleteNote, setNotes };
}

const emptyNote = {
  title: "",
  content: "",
};

function NotesApp() {
  // Notes logic
  const { notes, addNote, updateNote, deleteNote } = usePersistentNotes([
    {
      id: String(Date.now()),
      title: "Welcome to Notes!",
      content:
        "This is your first note. Create, edit, and delete notes using this simple, minimal app.",
    },
  ]);
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? null);
  const [filter, setFilter] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 600);

  // Find selected note (by ID)
  const selectedNote = notes.find((n) => n.id === selectedId);

  // Search/filter logic
  const filteredNotes =
    filter.trim() === ""
      ? notes
      : notes.filter(
          (n) =>
            n.title.toLowerCase().includes(filter.toLowerCase()) ||
            n.content.toLowerCase().includes(filter.toLowerCase())
        );

  // Handle new note creation
  function handleNewNote() {
    const newId = Date.now().toString();
    const defaultTitle = "Untitled Note";
    addNote({
      id: newId,
      title: defaultTitle,
      content: "",
    });
    setSelectedId(newId);
  }

  // Handle note deletion and auto-select
  function handleDeleteNote(id) {
    const idx = notes.findIndex((n) => n.id === id);
    deleteNote(id);
    // If deleting current, select prev or next
    if (id === selectedId) {
      if (notes.length > 1) {
        if (idx > 0) {
          setSelectedId(notes[idx - 1].id);
        } else {
          setSelectedId(notes[1]?.id ?? null);
        }
      } else {
        setSelectedId(null);
      }
    }
  }

  // Adjust sidebar visibility on resize
  React.useEffect(() => {
    function onResize() {
      setSidebarOpen(window.innerWidth >= 600);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function handleSelectNote(id) {
    setSelectedId(id);
  }

  return (
    <div className="notesapp-root" style={{ background: COLORS.bg }}>
      <HeaderBar
        onNewNote={handleNewNote}
        filter={filter}
        setFilter={setFilter}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        sidebarOpen={sidebarOpen}
      />
      <div className="notesapp-main">
        <Sidebar
          open={sidebarOpen}
          notes={filteredNotes}
          selectedId={selectedId}
          onSelect={handleSelectNote}
          onDelete={handleDeleteNote}
          onNewNote={handleNewNote}
        />
        <main className="notesapp-content">
          {selectedNote ? (
            <NoteEditor
              note={selectedNote}
              onChange={(updates) =>
                updateNote(selectedNote.id, { ...updates })
              }
              onDelete={() => handleDeleteNote(selectedNote.id)}
            />
          ) : (
            <EmptyState onNewNote={handleNewNote} />
          )}
        </main>
      </div>
    </div>
  );
}

// PUBLIC_INTERFACE
function HeaderBar({ onNewNote, filter, setFilter, onToggleSidebar, sidebarOpen }) {
  return (
    <header className="notesapp-header">
      {/* Hamburger for mobile/optional sidebar */}
      <button
        className="sidebar-toggle"
        onClick={onToggleSidebar}
        aria-label={sidebarOpen ? "Hide notes list" : "Show notes list"}
      >
        <span />
        <span />
        <span />
      </button>
      <span className="notesapp-title" tabIndex={0}>
        📝 Simple Notes
      </span>
      <div className="header-actions">
        <input
          className="notesapp-search"
          aria-label="Search notes"
          type="search"
          placeholder="Search notes..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
        <button className="notesapp-add-btn" onClick={onNewNote} title="New note">
          + New
        </button>
      </div>
    </header>
  );
}

// PUBLIC_INTERFACE
function Sidebar({ open, notes, selectedId, onSelect, onDelete, onNewNote }) {
  return (
    <aside
      className={`notesapp-sidebar${open ? " open" : ""}`}
      style={{
        minWidth: open ? SIDEBAR_MIN_WIDTH : 0,
        borderRight: open ? `1px solid ${COLORS.border}` : "none",
      }}
    >
      <div className="sidebar-header">
        <span>Notes</span>
        <button className="notesapp-add-btn" onClick={onNewNote} title="New note">
          +
        </button>
      </div>
      <ul className="sidebar-notes-list">
        {notes.length === 0 ? (
          <li className="sidebar-empty">No notes</li>
        ) : (
          notes.map((n) => (
            <li
              key={n.id}
              className={"sidebar-note" + (n.id === selectedId ? " selected" : "")}
              onClick={() => onSelect(n.id)}
              tabIndex={0}
              aria-current={n.id === selectedId}
            >
              <span className="sidebar-note-title">{n.title || "Untitled"}</span>
              <button
                className="sidebar-delete"
                title="Delete note"
                aria-label="Delete note"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(n.id);
                }}
              >
                🗑
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}

// PUBLIC_INTERFACE
function NoteEditor({ note, onChange, onDelete }) {
  const titleRef = useRef();
  React.useEffect(() => {
    if (titleRef.current) titleRef.current.focus();
  }, [note.id]);
  return (
    <section className="note-editor">
      <input
        ref={titleRef}
        className="note-title-input"
        type="text"
        value={note.title}
        onChange={(e) => onChange({ title: e.target.value })}
        aria-label="Note title"
        placeholder="Title"
        maxLength={80}
        style={{ color: COLORS.primary }}
      />
      <textarea
        className="note-content-input"
        value={note.content}
        onChange={(e) => onChange({ content: e.target.value })}
        aria-label="Note content"
        placeholder="Write your note here..."
        rows={12}
      />
      <div className="note-actions">
        <button
          className="danger delete-btn"
          onClick={onDelete}
          title="Delete this note"
        >
          Delete
        </button>
      </div>
    </section>
  );
}

// PUBLIC_INTERFACE
function EmptyState({ onNewNote }) {
  return (
    <section className="note-empty">
      <div className="empty-message">
        <h2>No note selected</h2>
        <button className="notesapp-add-btn" onClick={onNewNote}>
          + New Note
        </button>
      </div>
    </section>
  );
}

export default NotesApp;
