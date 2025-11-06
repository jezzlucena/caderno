import { useState, useEffect, type JSX } from 'react';
import { useTranslation } from 'react-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/toastify-custom.css';
import JournalList from './components/JournalList';
import RichTextEditor from './components/RichTextEditor';
import DonationNotification from './components/DonationNotification';
import HamburgerMenu from './components/HamburgerMenu';
import LoginModal from './components/modals/LoginModal';
import { useJournalStore } from './store/useStore';
import { useAuthStore } from './store/useAuthStore';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';
import { INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX, INTRUSIVE_NOTIFICATION_TIMEOUT_INTERVAL_MS } from './util/constants';
import { api } from './services/api';

type ViewState = 'list' | 'editor' | 'transitioning';
type AnimationDirection = 'toEditor' | 'toList' | null;

function App() {
  const { t } = useTranslation();
  const { currentEntryId } = useJournalStore();
  const { isAuthenticated, user, clearAuth, setAuth } = useAuthStore();
  const [viewState, setViewState] = useState<ViewState>('list');
  const [animationDirection, setAnimationDirection] = useState<AnimationDirection>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // region: Donation Notification
  const donationNotificationParams = [
    {
      bottom: INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX,
      right: INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX,
      timeout: 0
    },
  ];

  /* initiate donation notification positions at top: 50px; left: 50px; */
  for (
    let i = 0;
    window.innerHeight - INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX * i > 0 &&
    window.innerWidth - INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX * i > 0;
    i += 1
  ) {
    const offset = INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX + INTRUSIVE_NOTIFICATION_POSITION_OFFSET_INTERVAL_PX * i;
    donationNotificationParams.push({ bottom: offset, right: offset, timeout: INTRUSIVE_NOTIFICATION_TIMEOUT_INTERVAL_MS * i });
  }

  const [donationNotificationElements, setDonationNotificationElements] = useState<JSX.Element[]>([
    <DonationNotification
      key="0"
      onDismiss={() => {
        if (import.meta.env.VITE_SUSTAINER_PROGRAM_ENABLED === 'true') {
          setDonationNotificationElements([]);
        } else {
          for (const param of donationNotificationParams) {
            setTimeout(() => {
              setDonationNotificationElements(prev => [...prev, (
                <DonationNotification
                  key={param.timeout}
                  style={{ bottom: `${param.bottom}px`, right: `${param.right}px` }}
                  urgent
                />
              )]);
            }, param.timeout);
          }
        }
      }}
      style={{ bottom: "50px", right: "50px" }}
    />
  ]);
  // endregion: Donation Notification

  const handleSignOut = () => {
    localStorage.removeItem('token');
    clearAuth();
  };

  // Fetch subscription data on mount if authenticated
  useEffect(() => {
    const fetchSubscription = async () => {
      if (isAuthenticated && user) {
        try {
          const subData = await api.getSubscription();
          if (subData.subscription) {
            // Update user with subscription data
            setAuth({ ...user, subscription: subData.subscription }, localStorage.getItem('token') || '');
          }
        } catch (err) {
          console.error('Error fetching subscription:', err);
        }
      }
    };

    fetchSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

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
      
      {/* Global Navigation - accessible from all views */}
      <div className="fixed top-6 right-6 z-50 flex items-center gap-2">
        {isAuthenticated ? (
          <div className="flex items-center gap-2">
            <div className="text-right mr-2 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-gray-300 shadow-md">
              <span className="text-sm font-medium text-gray-700">{user?.email}</span>
              {user?.subscription && user.subscription.planId !== 'free' && (
                <span className="ml-2 text-xs text-indigo-600 border border-indigo-600 rounded-full px-2 py-0.5 font-semibold">
                  {user.subscription.planId.charAt(0).toUpperCase() + user.subscription.planId.slice(1)} {t('auth.plan')}
                </span>
              )}
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg border border-gray-300"
              title={t('auth.signOut')}
            >
              <ArrowRightOnRectangleIcon width={20} />
              <span className="text-sm">{t('auth.signOut')}</span>
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            title={t('auth.signIn')}
          >
            <UserCircleIcon width={20} />
            <span className="text-sm">{t('auth.signIn')}</span>
          </button>
        )}
        <HamburgerMenu />
      </div>
      
      {/* region: Donation Notification */}
      {/* Non-intrusive donation notification */}
      {import.meta.env.VITE_SUSTAINER_PROGRAM_ENABLED === 'true' && 
        <DonationNotification />
      }

      {/* Other donation notifications :) */}
      {import.meta.env.VITE_SUSTAINER_PROGRAM_ENABLED === 'false' && 
        donationNotificationElements
      }
      {/* endregion: Donation Notification */}

      {/* Login Modal */}
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} />}
      
      {/* Toast notifications */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </div>
  );
}

export default App;
