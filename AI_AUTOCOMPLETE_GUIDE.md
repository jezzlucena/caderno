# AI Autocomplete Setup Guide

## Overview

AI Autocomplete in Agenda provides intelligent writing suggestions and automatic entry summaries powered by HuggingFace's free SmollM3 language model. This feature helps you write faster and automatically generates concise summaries of your journal entries.

## Visual Guide

### Main Interface - Where to Find AI Features

```
┌─────────────────────────────────────────────────────────────┐
│  Agenda                                    ☰ Menu ←─────────┐│
├─────────────────────────────────────────────────────────────┤│
│                                                              ││
│  ┌────────────────────────────────────┐                     ││
│  │ Entry Title                        │                     ││
│  │ ✨ AI-generated summary here       │ ←── AI Summary     ││
│  │ Created: Today                      │     (appears here) ││
│  └────────────────────────────────────┘                     ││
│                                                              ││
│  ┌────────────────────────────────────┐                     ││
│  │ Another Entry                      │                     ││
│  │ Regular preview text...            │                     ││
│  └────────────────────────────────────┘                     ││
│                                                              ││
└─────────────────────────────────────────────────────────────┘│
                                                                │
  Open Menu → Settings → AI Autocomplete ─────────────────────┘
```

### Editor Interface - Using AI Autocomplete

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Entries                 My Journal Entry         │
├─────────────────────────────────────────────────────────────┤
│  [B] [I] [Code] | [H1] [H2] [H3] | [•] [1.] | [🖼️] | [↶] [↷] │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Today I went to the park and...                            │
│  [Your cursor here]                                          │
│                                                              │
│                                 ┌──────────────────────┐    │
│                                 │ ✨ AI Suggestion     │    │
│                                 │ "saw beautiful       │←───┤
│                                 │  flowers blooming"   │    │
│                                 │                      │    │
│                                 │ [Tab] Accept         │    │
│                                 │ [Esc] Dismiss        │    │
│                                 └──────────────────────┘    │
│                                                              │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  [Shift + Space] for AI suggestions ←────────────── Click! │
│  ↑ Click this bar OR press Shift+Space to get suggestions  │
└─────────────────────────────────────────────────────────────┘
```

### Settings Screen - Configuration

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                              ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🌐 Language                                      > │    │
│  │ Choose your preferred language                     │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ✨ AI Autocomplete                               > │←───┤
│  │ Get AI-powered writing suggestions                 │    │
│  └────────────────────────────────────────────────────┘    │
│  ↑ Click here to configure AI features                     │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ ☁️ Cloud Sync                                     > │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 🕐 Scheduled Exports                              > │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### AI Configuration Screen

```
┌─────────────────────────────────────────────────────────────┐
│  ← Settings          AI Autocomplete                   ✕    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  How to Get Your API Key                                    │
│  ┌────────────────────────────────────────────────────┐    │
│  │ 1. Visit huggingface.co                            │    │
│  │ 2. Create a free account                           │    │
│  │ 3. Generate your API key                           │    │
│  │ → Get your key here ────────────────────────────── │    │
│  └────────────────────────────────────────────────────┘    │
│                                                              │
│  🔑 API Key                                                 │
│  ┌────────────────────────────────────────────┐ [Show]     │
│  │ hf_••••••••••••••••••••••••••••••••••      │←─ Paste    │
│  └────────────────────────────────────────────┘   here     │
│                                                              │
│  ℹ️ Your API key is stored locally in your browser         │
│                                                              │
│                                          [Cancel]  [Save]   │
└─────────────────────────────────────────────────────────────┘
```

## Features

- **AI-Powered Text Completion**: Get intelligent writing suggestions as you type
- **Automatic Entry Summaries**: AI generates summaries of your entries automatically
- **Keyboard Shortcut**: Press `Shift + Space` to trigger AI suggestions
- **Completely Free**: Uses HuggingFace's free inference API

## Setup Instructions

### Step 1: Get Your HuggingFace API Key

1. Visit [huggingface.co](https://huggingface.co)
2. Sign up for a free account (you can use Google or GitHub)
3. Go to your [Settings → Access Tokens](https://huggingface.co/settings/tokens)
4. Click "New token" or "Create new token"
5. Give it a name (e.g., "Agenda Journal")
6. Select "Read" permission (this is sufficient for using the inference API)
7. Click "Generate token"
8. Copy your token (it will start with `hf_`)

### Step 2: Add API Key to Agenda

1. Open Agenda
2. Click the menu button (☰) in the top right
3. Select "Settings"
4. Navigate to "AI Autocomplete" section
5. Paste your HuggingFace API key in the input field
6. Click "Save"

Your API key is stored securely in your browser's local storage and is never sent to our servers.

### Step 3: Start Using AI Features

#### Getting Writing Suggestions

1. Open any journal entry
2. Start writing
3. Press `Shift + Space` when you want AI suggestions
4. The AI will provide a completion based on your context
5. Press `Tab` to accept the suggestion, or `Esc` to dismiss

Alternatively, click the bottom bar that says "Press Shift+Space for AI suggestions" to trigger suggestions.

#### Automatic Entry Summaries

- Summaries are generated automatically as you write
- After 10 seconds of inactivity, AI will generate a summary
- Summaries are also generated when you leave an entry
- You'll see a sparkles icon (✨) next to AI-generated summaries in the journal list

## Technical Details

### Model Information

- **Model**: HuggingFaceTB/SmolLM3-3B
- **Provider**: HuggingFace Inference API
- **API Endpoint**: `https://router.huggingface.co/v1/chat/completions`
- **Cost**: Free (subject to HuggingFace rate limits)

### How It Works

1. **Text Completion**: When you request a suggestion, the last 200 characters of your text are sent to the AI model for context
2. **Summary Generation**: When generating a summary, your entire entry content is analyzed
3. **Privacy**: All processing happens on HuggingFace's servers. Your API key and content are only sent to HuggingFace, never to Agenda's servers

### Rate Limits

HuggingFace's free tier includes:
- Rate limiting based on usage
- If you hit rate limits, wait a moment and try again
- For heavy usage, consider HuggingFace's Pro plan

## Troubleshooting

### "Invalid API key" error

- Double-check that you copied the entire API key
- Ensure the key starts with `hf_`
- Make sure you created a new token (old tokens may expire)
- Try generating a new API key

### "Rate limit exceeded" error

- You've made too many requests in a short time
- Wait a few moments and try again
- Spread out your AI requests to avoid hitting limits

### Suggestions aren't relevant

- Make sure you have enough context (write at least a few words)
- The AI works better with more context
- Try pressing `Shift + Space` again for different suggestions

### Summary not generating

- Make sure you have entered your API key
- Summaries generate after 10 seconds of inactivity or when leaving an entry
- Check browser console for any error messages

## Privacy & Security

- **Local Storage**: Your API key is stored in your browser's local storage
- **No Server Storage**: Agenda never stores your API key or content on its servers
- **Direct Communication**: Your content is sent directly to HuggingFace, not through Agenda's servers
- **Your Control**: You can remove your API key at any time from Settings

## Tips for Best Results

1. **Provide Context**: AI works better when you've written at least a sentence or two
2. **Be Specific**: The more specific your writing, the better the suggestions
3. **Iterate**: Don't accept the first suggestion if it's not quite right - dismiss and try again
4. **Natural Writing**: Write naturally first, use AI suggestions to help complete thoughts

## Removing AI Autocomplete

To disable AI Autocomplete:

1. Go to Settings → AI Autocomplete
2. Click "Remove API key"
3. Confirm the removal

Your journal entries and summaries will remain intact, but new summaries won't be generated.

## Support

For issues related to:
- **API Key Generation**: Contact HuggingFace support
- **Model Performance**: Report issues to HuggingFace
- **Agenda Integration**: Report bugs using the `/reportbug` command in the Agenda chat

## Additional Resources

- [HuggingFace Documentation](https://huggingface.co/docs)
- [SmolLM3 Model Card](https://huggingface.co/HuggingFaceTB/SmolLM3-3B)
- [HuggingFace Inference API](https://huggingface.co/docs/api-inference/index)
