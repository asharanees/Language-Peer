# AI Agents Module

This module contains the Strands AI agent implementations for LanguagePeer.

## Structure

- `personalities/` - Agent personality configurations and prompts
- `base/` - Base agent classes and interfaces
- `coordination/` - Multi-agent coordination logic

## Agent Personalities

1. **Friendly Tutor** - Encouraging and patient, focuses on positive reinforcement
2. **Strict Teacher** - Direct and structured, emphasizes accuracy and correction
3. **Conversation Partner** - Casual and engaging, simulates natural conversations
4. **Pronunciation Coach** - Specialized in pronunciation and phonetics

## Development

Each agent personality is implemented as a class extending the base `StrandsAgent` interface, with specific configurations for:

- System prompts and behavior patterns
- Voice characteristics (Polly voice selection)
- Feedback strategies and timing
- Difficulty adjustment algorithms
- Conversation flow management

## Integration

Agents integrate with:
- AWS Bedrock for LLM reasoning
- Amazon Polly for voice synthesis
- Amazon Comprehend for language analysis
- DynamoDB for conversation state management