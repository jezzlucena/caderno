import JournalList from './components/JournalList';
import RichTextEditor from './components/RichTextEditor';
import { useJournalStore } from './store/useStore';

function App() {
  const { currentEntryId } = useJournalStore();

  return (
    <>
      {currentEntryId ? <RichTextEditor /> : <JournalList />}
    </>
  );
}

export default App;
