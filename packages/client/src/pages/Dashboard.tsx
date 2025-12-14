import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PencilSquareIcon, BookOpenIcon, RssIcon } from '@heroicons/react/24/outline'
import { useAuthStore } from '../stores/authStore'
import { useCryptoStore } from '../stores/cryptoStore'
import { useUIStore } from '../stores/uiStore'
import { JournalList } from '../components/JournalList'
import { JournalEditor } from '../components/JournalEditor'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { Navbar } from '../components/Navbar'
import { EmailVerificationRequiredModal } from '../components/EmailVerificationRequiredModal'
import { type DecryptedEntry } from '../stores/entriesStore'

type View = 'list' | 'edit' | 'new'

export function Dashboard() {
  const { user, checkAuth } = useAuthStore()
  const { isKeyReady } = useCryptoStore()
  const { isSidebarOpen, closeSidebar, openSidebar } = useUIStore()
  const [currentView, setCurrentView] = useState<View>('list')
  const [selectedEntry, setSelectedEntry] = useState<DecryptedEntry | null>(null)
  const [showVerificationModal, setShowVerificationModal] = useState(false)

  useEffect(() => {
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSelectEntry = (entry: DecryptedEntry) => {
    setSelectedEntry(entry)
    setCurrentView('edit')
    closeSidebar() // Close sidebar on mobile
  }

  const handleNewEntry = () => {
    if (!user?.emailVerified) {
      setShowVerificationModal(true)
      return
    }
    setSelectedEntry(null)
    setCurrentView('new')
    closeSidebar() // Close sidebar on mobile
  }

  const handleSave = () => {
    setCurrentView('list')
  }

  const handleCancel = () => {
    setCurrentView('list')
    setSelectedEntry(null)
  }

  // Show unlock prompt if encryption key is not ready
  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200 flex flex-col animate-fade-in">
      <Navbar currentPage="journal" />

      {/* Tab Navigation */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4">
          <div role="tablist" className="tabs tabs-bordered">
            <button role="tab" className="tab tab-active gap-2">
              <BookOpenIcon className="h-4 w-4" />
              Journal
            </button>
            <Link to="/feed" role="tab" className="tab gap-2">
              <RssIcon className="h-4 w-4" />
              Feed
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main id="main-content" className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-20 lg:hidden"
            onClick={closeSidebar}
          />
        )}

        {/* Sidebar - Entry List */}
        <div className={`
          fixed lg:static inset-y-0 left-0 z-30
          w-80 bg-base-100 border-r border-base-300 p-4
          overflow-hidden flex flex-col ios-scroll
          transform transition-all duration-300
          ${isSidebarOpen ? 'translate-x-0 sidebar-enter' : '-translate-x-full lg:translate-x-0'}
          top-16 lg:top-0
        `}
        style={{ transitionTimingFunction: 'cubic-bezier(0.25, 0.1, 0.25, 1)' }}
        >
          <JournalList
            onSelect={handleSelectEntry}
            onNew={handleNewEntry}
            selectedId={selectedEntry?.id}
          />
        </div>

        {/* Main Area - Editor */}
        <div className="flex-1 p-3 sm:p-6 overflow-hidden">
          {currentView === 'list' ? (
            <div className="h-full flex items-center justify-center text-base-content/50">
              <div className="text-center px-4">
                <PencilSquareIcon className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" strokeWidth={1} />
                <p className="text-base sm:text-lg">Select an entry or create a new one</p>
                <p className="text-xs sm:text-sm mt-2">Your entries are end-to-end encrypted</p>
                <button
                  className="btn btn-primary btn-sm mt-4 lg:hidden"
                  onClick={openSidebar}
                >
                  View Entries
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <JournalEditor
                entry={currentView === 'edit' ? selectedEntry : null}
                onSave={handleSave}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
      </main>

      {showVerificationModal && (
        <EmailVerificationRequiredModal onClose={() => setShowVerificationModal(false)} />
      )}
    </div>
  )
}
