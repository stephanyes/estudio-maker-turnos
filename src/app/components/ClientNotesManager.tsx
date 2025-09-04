'use client';

import { useState } from 'react';
import { DateTime } from 'luxon';
import { Plus, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { useClientNotes, useCreateClientNote, useUpdateClientNote, useDeleteClientNote } from '../../lib/queries';
import type { ClientNote } from '../../lib/supabase-db';

type Props = {
  clientId: string;
  clientName: string;
};

export default function ClientNotesManager({ clientId, clientName }: Props) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteText, setEditingNoteText] = useState('');

  const limit = 10; // 10 notas por página

  // Hooks para datos
  const { data: notes, isLoading, error } = useClientNotes(clientId, currentPage, limit);
  const createNoteMutation = useCreateClientNote();
  const updateNoteMutation = useUpdateClientNote();
  const deleteNoteMutation = useDeleteClientNote();

  const handleAddNote = async () => {
    if (!newNoteText.trim()) return;

    try {
      await createNoteMutation.mutateAsync({
        clientId,
        noteText: newNoteText.trim(),
        createdBy: 'system', // TODO: Usar usuario actual cuando esté disponible
      });
      setNewNoteText('');
      setIsAddingNote(false);
    } catch (error) {
      console.error('Error al crear nota:', error);
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editingNoteText.trim()) return;

    try {
      await updateNoteMutation.mutateAsync({
        id: noteId,
        updates: { noteText: editingNoteText.trim() },
      });
      setEditingNoteId(null);
      setEditingNoteText('');
    } catch (error) {
      console.error('Error al actualizar nota:', error);
    }
  };

  const handleDeleteNote = async (note: ClientNote) => {
    // Verificar si la nota tiene menos de 24 horas
    const noteDate = DateTime.fromISO(note.createdAt);
    const now = DateTime.now();
    const hoursDiff = now.diff(noteDate, 'hours').hours;
    
    if (hoursDiff > 24) {
      alert('No se pueden eliminar notas que tengan más de 24 horas de antigüedad.');
      return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta nota?')) return;

    try {
      await deleteNoteMutation.mutateAsync(note.id);
    } catch (error) {
      console.error('Error al eliminar nota:', error);
    }
  };

  const startEditing = (note: ClientNote) => {
    // Verificar si la nota tiene menos de 24 horas
    const noteDate = DateTime.fromISO(note.createdAt);
    const now = DateTime.now();
    const hoursDiff = now.diff(noteDate, 'hours').hours;
    
    if (hoursDiff > 24) {
      alert('No se pueden editar notas que tengan más de 24 horas de antigüedad.');
      return;
    }
    
    setEditingNoteId(note.id);
    setEditingNoteText(note.noteText);
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const inputCls = 'w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-neutral-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent px-3 py-2';

  // Helper para verificar si una nota se puede editar/eliminar
  const canEditNote = (note: ClientNote): boolean => {
    const noteDate = DateTime.fromISO(note.createdAt);
    const now = DateTime.now();
    const hoursDiff = now.diff(noteDate, 'hours').hours;
    return hoursDiff <= 24;
  };

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        Error al cargar las notas: {error.message}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-sky-600" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Historial de Notas
          </h3>
        </div>
        <button
          onClick={() => setIsAddingNote(true)}
          className="flex items-center gap-2 px-3 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Nota
        </button>
      </div>

      {/* Formulario para nueva nota */}
      {isAddingNote && (
        <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
          <div className="space-y-3">
            <label className="block">
              <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Nueva nota para {clientName}
              </span>
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className={inputCls}
                placeholder="Escribe una observación sobre este cliente..."
                rows={3}
                autoFocus
              />
            </label>
            <div className="flex gap-2">
              <button
                onClick={handleAddNote}
                disabled={!newNoteText.trim() || createNoteMutation.isPending}
                className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createNoteMutation.isPending ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNoteText('');
                }}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lista de notas */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-4 text-center text-zinc-500">
            Cargando notas...
          </div>
        ) : notes && notes.length > 0 ? (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-4 bg-white dark:bg-neutral-800 rounded-lg border border-zinc-200 dark:border-zinc-700"
            >
              {editingNoteId === note.id ? (
                // Modo edición
                <div className="space-y-3">
                  <textarea
                    value={editingNoteText}
                    onChange={(e) => setEditingNoteText(e.target.value)}
                    className={inputCls}
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdateNote(note.id)}
                      disabled={!editingNoteText.trim() || updateNoteMutation.isPending}
                      className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {updateNoteMutation.isPending ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 dark:hover:bg-neutral-800 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                // Modo visualización
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-zinc-900 dark:text-zinc-100 flex-1">
                      {note.noteText}
                    </p>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEditing(note)}
                        disabled={!canEditNote(note)}
                        className={`p-1 transition-colors ${
                          canEditNote(note)
                            ? 'text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                            : 'text-zinc-200 dark:text-zinc-600 cursor-not-allowed'
                        }`}
                        title={canEditNote(note) ? "Editar nota" : "No se pueden editar notas con más de 24 horas"}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note)}
                        disabled={!canEditNote(note)}
                        className={`p-1 transition-colors ${
                          canEditNote(note)
                            ? 'text-zinc-400 hover:text-red-500'
                            : 'text-zinc-200 dark:text-zinc-600 cursor-not-allowed'
                        }`}
                        title={canEditNote(note) ? "Eliminar nota" : "No se pueden eliminar notas con más de 24 horas"}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                    {DateTime.fromISO(note.createdAt).toLocaleString(DateTime.DATETIME_MED)}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p>No hay notas para este cliente</p>
            <p className="text-sm mt-1">Agrega la primera nota usando el botón "Nueva Nota"</p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {notes && notes.length === limit && (
        <div className="flex justify-center">
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-neutral-800"
          >
            Cargar más notas
          </button>
        </div>
      )}
    </div>
  );
}
