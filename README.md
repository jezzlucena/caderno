# Caderno - Personal Journal App

A beautiful, privacy-focused personal journal application built with React, TypeScript, and modern web technologies. Write your thoughts, attach images, and leverage AI-powered autocomplete - all with optional encryption for maximum privacy.

Please checkout [src/utils/constants.ts](src/utils/constants.ts) for a quick message from the creator.

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)
![Vite](https://img.shields.io/badge/Vite-6-purple)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-4-cyan)

## Features

### 📝 Rich Text Editor
- Full-featured WYSIWYG editor powered by [TipTap](https://tiptap.dev/)
- Text formatting: **bold**, *italic*, code, headings (H1, H2, H3)
- Lists: bullet points and numbered lists
- Image support with drag-to-resize functionality
- Base64 image encoding (no external hosting required)
- Undo/redo functionality

### 🤖 AI-Powered Autocomplete
- Intelligent text completion using [OpenRouter's DeepSeek Chat v3.1](https://openrouter.ai/) (completely free)
- Trigger with `Shift + Space`
- Accept suggestions with `Tab`
- Dismiss with `Esc`
- Context-aware predictions based on your writing

### 🔒 Privacy & Security
- All data stored locally in your browser (localStorage)
- Export your journal with optional AES encryption
- Password-protected backups
- No cloud storage, no tracking, no analytics
- Your data never leaves your device (except encrypted exports)

### 🌍 Internationalization
Full support for 8 languages:
- 🇺🇸 English (USA)
- 🇬🇧 English (UK)
- 🇧🇷 Português (Brasil)
- 🇵🇹 Português (Portugal)
- 🇲🇽 Español (Latin America)
- 🇪🇸 Español (España)
- 🇨🇳 中文 (Mandarin)
- 🇯🇵 日本語 (Japanese)

### 💾 Import/Export
- Export all entries to encrypted JSON file
- Import from backup with merge or replace options
- Automatic encryption detection
- Data portability and backup safety

### 🎨 Modern UI/UX
- Clean, intuitive interface with gradient backgrounds
- Responsive design (mobile, tablet, desktop)
- Smooth animations and transitions
- Professional iconography with [Heroicons](https://heroicons.com/)

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 6
- **Styling**: TailwindCSS 4
- **State Management**: Zustand with persist middleware
- **Rich Text Editor**: TipTap with StarterKit & ImageResize extensions
- **Internationalization**: react-i18next
- **Encryption**: crypto-js (AES)
- **AI Integration**: OpenRouter API (DeepSeek Chat v3.1)
- **Icons**: Heroicons

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn/pnpm

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd caderno

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Building for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview
```

## Usage Guide

### Creating Your First Entry

1. Click the "+" button on the home screen
2. Enter a title for your journal entry
3. Start writing in the rich text editor
4. Use the toolbar to format your text
5. Click the back arrow when done

### Using AI Autocomplete

1. Open the settings (gear icon)
2. Get a free API key from [OpenRouter](https://openrouter.ai/keys)
3. Paste your API key and save
4. While writing, press `Shift + Space` to get AI suggestions
5. Press `Tab` to accept or `Esc` to dismiss

### Adding Images

1. Click the photo icon in the toolbar
2. Select an image from your device
3. Drag the corners to resize the image
4. Images are stored as base64 (no external hosting needed)

### Exporting Your Journal

1. Click "Export" on the home screen
2. Choose whether to encrypt with a passphrase
3. Enter a strong passphrase (min 8 characters)
4. Save the JSON file to a safe location

### Importing a Backup

1. Click "Import" on the home screen
2. Select your backup JSON file
3. If encrypted, enter your passphrase
4. Choose to merge with existing entries or replace all

### Changing Language

1. Click the language dropdown (top-right)
2. Select your preferred language
3. All UI text will update instantly

## Project Structure

```
caderno/
├── src/
│   ├── components/          # React components
│   │   ├── RichTextEditor.tsx    # Main editor component
│   │   ├── JournalList.tsx       # Entry list view
│   │   ├── ExportModal.tsx       # Export functionality
│   │   ├── ImportModal.tsx       # Import functionality
│   │   ├── SettingsModal.tsx     # API key settings
│   │   └── LanguageSelector.tsx  # Language switcher
│   ├── store/               # Zustand state management
│   │   └── useStore.ts           # Journal entries store
│   ├── services/            # External services
│   │   └── aiCompletion.ts       # OpenRouter API integration
│   ├── i18n/                # Translations
│   │   ├── index.ts              # i18next config
│   │   └── locales/              # Translation files
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles
├── public/                  # Static assets
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── tailwind.config.js       # Tailwind configuration
└── tsconfig.json            # TypeScript configuration
```

## Key Components

### RichTextEditor
The main editor component with TipTap integration, AI autocomplete, and image handling.

### JournalList
Displays all journal entries with preview, creation date, and actions (edit, delete).

### useJournalStore (Zustand)
Centralized state management for:
- Journal entries (CRUD operations)
- Current entry selection
- Data persistence to localStorage
- Export/import with encryption

### aiCompletion Service
Handles OpenRouter API calls for text completion with configurable parameters:
- `mode`: 'predict' (autocomplete) or 'summarize' (generate title)
- `maxTokens`: Response length
- `temperature`: Creativity level

## Configuration

### Environment Variables

No environment variables required! API keys are stored securely in localStorage.

### Customization

**Change AI Model**: Edit [src/services/aiCompletion.ts](src/services/aiCompletion.ts) and update the model name:
```typescript
model: 'deepseek/deepseek-chat-v3.1:free', // Change to any OpenRouter model
```

**Add More Languages**:
1. Create a new translation file in `src/i18n/locales/`
2. Import it in [src/i18n/index.ts](src/i18n/index.ts)
3. Add the language option in [LanguageSelector.tsx](src/components/LanguageSelector.tsx)

**Customize Editor**: Modify TipTap extensions in [src/components/RichTextEditor.tsx](src/components/RichTextEditor.tsx)

## Security Considerations

- **Local Storage**: Data is stored in browser localStorage (unencrypted by default)
- **Exports**: Use strong passphrases (12+ characters recommended)
- **API Keys**: Stored in localStorage - use browser profiles for additional isolation
- **Images**: Base64 encoding increases storage size but avoids external dependencies
- **HTTPS**: Always deploy with HTTPS in production

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## Performance

- Entries are loaded on-demand
- Images are base64-encoded (may affect performance with many large images)
- Zustand persist middleware debounces saves
- Production builds are optimized with Vite

## Troubleshooting

### AI Autocomplete Not Working
- Ensure you have a valid OpenRouter API key
- Check browser console for error messages
- Verify your internet connection

### Images Not Loading
- Check image file size (recommended < 5MB)
- Verify browser supports FileReader API
- Clear localStorage if corrupted: `localStorage.clear()`

### Export/Import Failing
- Ensure correct passphrase for encrypted files
- Verify JSON file is not corrupted
- Check browser console for detailed errors

### Language Not Changing
- Clear browser cache and reload
- Verify translation file exists for that language
- Check browser console for i18next errors

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [TipTap](https://tiptap.dev/) - Excellent headless editor framework
- [OpenRouter](https://openrouter.ai/) - Free AI API access
- [Heroicons](https://heroicons.com/) - Beautiful icon set
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Zustand](https://zustand-demo.pmnd.rs/) - Lightweight state management

## Roadmap

- [ ] Cloud sync with end-to-end encryption
- [ ] Mobile apps (React Native)
- [ ] Rich media support (audio, video)
- [ ] Advanced search and filtering
- [ ] Tags and categories
- [ ] Daily prompts and reminders
- [ ] Markdown export
- [ ] Print-friendly layouts

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

Built with ❤️ using React and TypeScript
