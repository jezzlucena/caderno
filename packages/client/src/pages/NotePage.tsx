import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { profileApi, type SingleNoteResponse } from '../lib/api'
import { Footer } from '../components/Footer'
import { NoteCard } from '../components/NoteCard'

export function NotePage() {
  const { username, noteId } = useParams<{ username: string; noteId: string }>()
  const [noteData, setNoteData] = useState<SingleNoteResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchNote = async () => {
      if (!username || !noteId) return

      setLoading(true)
      setError(null)

      try {
        const data = await profileApi.getNote(username, parseInt(noteId))
        setNoteData(data)
      } catch (err: any) {
        setError(err.message || 'Note not found')
      } finally {
        setLoading(false)
      }
    }

    fetchNote()
  }, [username, noteId])

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">

      <div className="container mx-auto px-4 py-8 max-w-2xl flex-1">
        {loading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <div className="text-6xl mb-4">404</div>
              <h2 className="card-title">Note Not Found</h2>
              <p className="text-base-content/70 mb-4">
                This note doesn't exist or you don't have permission to view it.
              </p>
              <Link to="/" className="btn btn-primary">
                Go Home
              </Link>
            </div>
          </div>
        ) : noteData ? (
          <div className="space-y-4">
            {/* Back to profile link */}
            <Link
              to={`/${noteData.author.username}`}
              className="btn btn-ghost btn-sm gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to @{noteData.author.username}
            </Link>

            {/* Note card without timestamp link (we're already on the permalink) */}
            <NoteCard
              id={noteData.note.id}
              title={noteData.note.title}
              content={noteData.note.content}
              visibility={noteData.note.visibility}
              published={noteData.note.published}
              author={{
                username: noteData.author.username,
                displayName: noteData.author.displayName,
                isLocal: true
              }}
              showAuthor={true}
              showVisibilityBadge={true}
              isOwner={noteData.isOwner}
            />
          </div>
        ) : null}
      </div>

      <Footer />
    </div>
  )
}
