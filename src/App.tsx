import { useState, useEffect } from 'react';
import JournalList from './components/JournalList';
import RichTextEditor from './components/RichTextEditor';
import DonationNotification from './components/DonationNotification';
import { useJournalStore } from './store/useStore';

type ViewState = 'list' | 'editor' | 'transitioning';
type AnimationDirection = 'toEditor' | 'toList' | null;

function App() {
  const { currentEntryId } = useJournalStore();
  const [viewState, setViewState] = useState<ViewState>('list');
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const targetView = currentEntryId ? 'editor' : 'list';

    if (targetView === viewState || isTransitioning) {
      return;
    }

    // Start transition
    setIsTransitioning(true);
    setAnimationDirection(targetView === 'editor' ? 'toEditor' : 'toList');

    // Wait for exit animation to complete, then change view
    setTimeout(() => {
      setViewState(targetView);
      setIsTransitioning(false);
    }, 300); // Match animation duration
  }, [currentEntryId, viewState, isTransitioning]);

  const getAnimationClass = (view: 'list' | 'editor') => {
    if (!animationDirection) return '';

    if (view === 'list') {
      return animationDirection === 'toList' ? 'animate-slideInFromLeft' : 'animate-slideOutToLeft';
    } else {
      return animationDirection === 'toEditor' ? 'animate-slideInFromRight' : 'animate-slideOutToRight';
    }
  };

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {(viewState === 'list' || isTransitioning) && (
        <div className={`absolute inset-0 ${getAnimationClass('list')}`}>
          <JournalList />
        </div>
      )}
      {(viewState === 'editor' || isTransitioning) && (
        <div className={`absolute inset-0 ${getAnimationClass('editor')}`}>
          <RichTextEditor />
        </div>
      )}
      
      {/* Non-intrusive donation notification */}
      <DonationNotification />
    </div>
  );
}

export default App;
