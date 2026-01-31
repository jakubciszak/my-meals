import { useState } from 'react'
import { useFamilyMembers } from '../hooks/useFamilyMembers'

export default function FamilyPage() {
  const { members, isLoading, addMember, updateMember, deleteMember } = useFamilyMembers()
  const [newMemberName, setNewMemberName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  const handleAddMember = () => {
    if (!newMemberName.trim()) return
    addMember(newMemberName)
    setNewMemberName('')
  }

  const handleStartEdit = (id: string, currentName: string) => {
    setEditingId(id)
    setEditingName(currentName)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editingName.trim()) return
    updateMember(editingId, { name: editingName })
    setEditingId(null)
    setEditingName('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditingName('')
  }

  const handleDeleteMember = (id: string) => {
    deleteMember(id)
  }

  return (
    <div className="px-4 py-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Rodzina</h1>
        <p className="text-gray-500">Zarzadzaj czlonkami rodziny</p>
      </header>

      <section className="mb-6">
        <div className="card">
          <h2 className="text-lg font-semibold mb-3">Dodaj czlonka rodziny</h2>
          <div className="flex gap-2">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
              placeholder="Imie"
              className="input flex-1"
              aria-label="Imie czlonka rodziny"
            />
            <button
              onClick={handleAddMember}
              className="btn-primary"
              aria-label="Dodaj czlonka rodziny"
            >
              Dodaj
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Czlonkowie rodziny</h2>
        <div className="space-y-3">
          {isLoading ? (
            <p className="text-gray-500 text-center py-8">Ladowanie...</p>
          ) : members.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Brak dodanych czlonkow rodziny.
            </p>
          ) : (
            members.map((member) => (
              <div key={member.id} className="card">
                {editingId === member.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit()
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      className="input flex-1"
                      aria-label="Edytuj imie"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveEdit}
                      className="btn-primary p-2"
                      aria-label="Zapisz"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="btn-ghost p-2 text-gray-500"
                      aria-label="Anuluj"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold">
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <p className="font-medium text-gray-900">{member.name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(member.id, member.name)}
                        className="btn-ghost p-2 text-gray-500 hover:text-gray-700"
                        aria-label={`Edytuj ${member.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMember(member.id)}
                        className="btn-ghost text-red-500 hover:text-red-700 p-2"
                        aria-label={`Usun ${member.name}`}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
