# Demo Video Script (3 Minutes)

## Introduction (30 seconds)

**[Screen: LanguagePeer logo and tagline]**

"Hi, I'm demonstrating LanguagePeer - a voice-first GenAI application that helps language learners build fluency through natural conversations with autonomous AI agents.

**[Screen: Problem statement with statistics]**

Language learners face three major challenges: finding consistent speaking partners, overcoming speaking anxiety, and getting meaningful feedback. LanguagePeer solves this with AI agents powered by AWS Bedrock that provide judgment-free practice anytime, anywhere."

## Live Agent Interaction Demo (90 seconds)

**[Screen: LanguagePeer web interface]**

"Let me show you how it works. I'll start a conversation session and select Maria, our friendly tutor agent powered by Claude 3.5 Sonnet."

**[Demo: Voice interaction with AI agent]**
- User speaks: "Hello, I'd like to practice ordering food at a restaurant"
- Agent responds with natural voice: "¡Hola! I'd love to help you practice. Let's imagine we're at a Spanish restaurant..."

**[Screen: Real-time feedback panel]**

"Notice how the system provides real-time feedback on grammar, pronunciation, and vocabulary. The agent autonomously decided to switch to a restaurant scenario and adjusted the difficulty based on my response."

**[Demo: Agent handoff]**
- Show transition to pronunciation coach agent
- Demonstrate SSML-powered pronunciation guidance
- Show progress tracking updates

"The Strands framework enables seamless handoffs between specialized agents. Here, the pronunciation coach is using Amazon Polly's SSML to help with specific sounds."

## Technical Architecture (45 seconds)

**[Screen: Architecture diagram]**

"LanguagePeer meets all AWS GenAI Hackathon requirements:

1. **LLM Integration**: Multiple Bedrock foundation models with dynamic routing
2. **Required AWS Services**: Bedrock Agents, Transcribe, Polly, Comprehend, Lambda, DynamoDB, and Kinesis
3. **Autonomous AI Agents**: Strands-powered agents make independent decisions about conversation flow, difficulty adjustment, and feedback timing

**[Screen: Code snippets showing autonomous decision-making]**

The agents use external tools like Transcribe for voice processing, Comprehend for language analysis, and DynamoDB for progress tracking - all without human intervention."

## Results and Impact (15 seconds)

**[Screen: Progress dashboard and user testimonials]**

"Users see measurable improvement in fluency scores, grammar accuracy, and confidence levels. LanguagePeer makes language learning accessible, personalized, and effective.

**[Screen: GitHub repository and demo link]**

Try it yourself at language-peer.demo.aws or explore the code on GitHub. Thank you!"

## Technical Notes for Recording

- **Screen Resolution**: 1920x1080 for clear visibility
- **Audio Quality**: Use high-quality microphone for voice demos
- **Timing**: Practice to stay within 3-minute limit
- **Backup Plan**: Have pre-recorded voice samples if live demo fails
- **Captions**: Include subtitles for accessibility

## Demo Environment Setup

```bash
# Ensure demo environment is running
aws cloudformation describe-stacks --stack-name LanguagePeerDemo

# Test all endpoints before recording
curl https://demo-api.languagepeer.com/health

# Verify agent responses are working
# Test voice recording and playback
# Check real-time feedback display
```