import { useEffect, useState, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowPathIcon, BookOpenIcon, RssIcon, PlusIcon, PaperAirplaneIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { federationApi, type FeedEntry, type NoteVisibility } from '../lib/api'
import { Navbar } from '../components/Navbar'
import { FeedCard } from '../components/FeedCard'
import { FeedSkeleton } from '../components/FeedSkeleton'
import { UnlockPrompt } from '../components/UnlockPrompt'
import { useCryptoStore } from '../stores/cryptoStore'

const MAX_PAGES_PER_BATCH = 10

export function Feed() {
  const { isKeyReady } = useCryptoStore()
  const [entries, setEntries] = useState<FeedEntry[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagesLoaded, setPagesLoaded] = useState(0)
  const [autoScrollEnabled, setAutoScrollEnabled] = useState(true)

  // Post creation state
  const [isComposing, setIsComposing] = useState(false)
  const [postTitle, setPostTitle] = useState('')
  const [postContent, setPostContent] = useState('')
  const [postVisibility, setPostVisibility] = useState<NoteVisibility>('public')
  const [isPosting, setIsPosting] = useState(false)
  const [postError, setPostError] = useState<string | null>(null)

  const observerRef = useRef<HTMLDivElement>(null)

  // Initial load
  const loadFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsLoading(true)
      setEntries([])
      setCursor(null)
      setPagesLoaded(0)
      setAutoScrollEnabled(true)
    }
    setError(null)

    try {
      const response = await federationApi.getFeed(undefined, 20)
      setEntries(response.entries)
      setCursor(response.nextCursor)
      setHasMore(response.hasMore)
      setPagesLoaded(1)
    } catch (err: any) {
      setError(err.message || 'Failed to load feed')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Load more entries
  const loadMore = useCallback(async () => {
    if (!cursor || isLoadingMore || !hasMore) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const response = await federationApi.getFeed(cursor, 20)
      setEntries(prev => [...prev, ...response.entries])
      setCursor(response.nextCursor)
      setHasMore(response.hasMore)

      const newPagesLoaded = pagesLoaded + 1
      setPagesLoaded(newPagesLoaded)

      // Disable auto-scroll after reaching the limit
      if (newPagesLoaded >= MAX_PAGES_PER_BATCH) {
        setAutoScrollEnabled(false)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load more entries')
    } finally {
      setIsLoadingMore(false)
    }
  }, [cursor, isLoadingMore, hasMore, pagesLoaded])

  // Enable more pages of infinite scroll
  const enableMorePages = () => {
    setPagesLoaded(0)
    setAutoScrollEnabled(true)
  }

  // Handle posting a new entry
  const handlePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      setPostError('Please enter a title and content')
      return
    }

    setIsPosting(true)
    setPostError(null)

    try {
      await federationApi.publish({
        title: postTitle.trim(),
        content: postContent.trim(),
        visibility: postVisibility
      })

      // Reset form
      setPostTitle('')
      setPostContent('')
      setPostVisibility('public')
      setIsComposing(false)

      // Refresh feed to show new post
      loadFeed(true)
    } catch (err: any) {
      setPostError(err.message || 'Failed to publish post')
    } finally {
      setIsPosting(false)
    }
  }

  // Initial load when key is ready
  useEffect(() => {
    if (isKeyReady) {
      loadFeed()
    }
  }, [isKeyReady, loadFeed])

  // Infinite scroll observer
  useEffect(() => {
    if (!autoScrollEnabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading && autoScrollEnabled) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )

    if (observerRef.current) {
      observer.observe(observerRef.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, loadMore, autoScrollEnabled])

  if (!isKeyReady) {
    return <UnlockPrompt />
  }

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar currentPage="feed" />

      {/* Tab Navigation */}
      <div className="bg-base-100 border-b border-base-300">
        <div className="container mx-auto px-4">
          <div role="tablist" className="tabs tabs-bordered">
            <Link to="/" role="tab" className="tab gap-2">
              <BookOpenIcon className="h-4 w-4" />
              Journal
            </Link>
            <button role="tab" className="tab tab-active gap-2">
              <RssIcon className="h-4 w-4" />
              Feed
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-2xl animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Your Feed</h1>
          <div className="flex gap-2">
            <button
              className="btn btn-primary btn-sm gap-2"
              onClick={() => setIsComposing(!isComposing)}
            >
              {isComposing ? <XMarkIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
              {isComposing ? 'Cancel' : 'New Post'}
            </button>
            <button
              className="btn btn-ghost btn-sm gap-2"
              onClick={() => loadFeed(true)}
              disabled={isLoading}
            >
              <ArrowPathIcon className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        {/* Compose Post Form */}
        {isComposing && (
          <div className="card bg-base-100 shadow-lg mb-6">
            <div className="card-body p-4">
              <h3 className="font-semibold mb-3">Create a new post</h3>

              {postError && (
                <div className="alert alert-error mb-3 py-2">
                  <span className="text-sm">{postError}</span>
                </div>
              )}

              <input
                type="text"
                placeholder="Post title"
                className="input input-bordered w-full mb-3"
                value={postTitle}
                onChange={(e) => setPostTitle(e.target.value)}
                disabled={isPosting}
                maxLength={200}
              />

              <textarea
                placeholder="What's on your mind?"
                className="textarea textarea-bordered w-full mb-3 min-h-24"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                disabled={isPosting}
                maxLength={50000}
              />

              <div className="flex items-center justify-between">
                <select
                  className="select select-bordered select-sm"
                  value={postVisibility}
                  onChange={(e) => setPostVisibility(e.target.value as NoteVisibility)}
                  disabled={isPosting}
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers only</option>
                  <option value="private">Private</option>
                </select>

                <button
                  className="btn btn-primary btn-sm gap-2"
                  onClick={handlePost}
                  disabled={isPosting || !postTitle.trim() || !postContent.trim()}
                >
                  {isPosting ? (
                    <span className="loading loading-spinner loading-xs" />
                  ) : (
                    <PaperAirplaneIcon className="h-4 w-4" />
                  )}
                  {isPosting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="alert alert-error mb-4">
            <span>{error}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => loadFeed(true)}>
              Retry
            </button>
          </div>
        )}

        {/* Loading state */}
        {isLoading && (
          <FeedSkeleton count={5} />
        )}

        {/* Empty state */}
        {!isLoading && !error && entries.length === 0 && (
          <div className="card bg-base-100 shadow-xl">
            <div className="card-body items-center text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="card-title">No posts yet</h2>
              <p className="text-base-content/70 max-w-md">
                Your feed is empty. Follow some users to see their content here!
              </p>
            </div>
          </div>
        )}

        {/* Feed entries */}
        {!isLoading && entries.length > 0 && (
          <div className="space-y-4">
            {entries.map((entry) => (
              <FeedCard key={entry.id} entry={entry} />
            ))}

            {/* Infinite scroll trigger */}
            {autoScrollEnabled && <div ref={observerRef} className="h-10" />}

            {/* Loading more indicator */}
            {isLoadingMore && (
              <FeedSkeleton count={2} />
            )}

            {/* Load More button when auto-scroll is paused */}
            {!autoScrollEnabled && hasMore && !isLoadingMore && (
              <div className="text-center py-6">
                <button
                  className="btn btn-primary btn-wide"
                  onClick={enableMorePages}
                >
                  Load More
                </button>
              </div>
            )}

            {/* End of feed */}
            {!hasMore && entries.length > 0 && (
              <div className="text-center py-8 text-base-content/60">
                You've reached the end
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
