# LanguagePeer Architecture Diagram

## 🏗️ Complete System Architecture

```mermaid
graph TB
    subgraph "User Interface Layer"
        UI[React Frontend<br/>Enhanced Offline-First Interface]
        VR[Voice Recorder<br/>WebRTC Audio Capture]
        AP[Audio Player<br/>Playback & Visualization]
        AS[Agent Selector<br/>Personality Selection]
        FP[Feedback Panel<br/>Local Analytics]
        LS[Local Storage<br/>Session Management]
        MR[Enhanced Mock Responses<br/>Contextual AI Simulation]
        IF[Intelligent Feedback<br/>Offline Analysis Engine]
    end

    subgraph "API Gateway Layer"
        GW[AWS API Gateway<br/>RESTful Endpoints]
        AUTH[Authentication<br/>JWT & Session Management]
        CORS[CORS Configuration<br/>Cross-Origin Requests]
        RATE[Rate Limiting<br/>Request Throttling]
    end

    subgraph "Serverless Compute Layer"
        CO[Conversation Orchestrator<br/>AWS Lambda]
        AC[Agent Coordinator<br/>AWS Lambda]
        LA[Language Analyzer<br/>AWS Lambda]
        PA[Progress Analytics<br/>AWS Lambda]
        RE[Recommendation Engine<br/>AWS Lambda]
    end

    subgraph "AI/ML Services Layer"
        subgraph "AWS Bedrock Foundation Models"
            CLAUDE[Claude 3.5 Sonnet<br/>Primary Conversations]
            LLAMA[Llama 3.1 70B<br/>Alternative Responses]
            NOVA[Nova Pro<br/>Multimodal Capabilities]
        end
        
        subgraph "Voice Processing"
            TRANSCRIBE[Amazon Transcribe<br/>Speech-to-Text Streaming]
            POLLY[Amazon Polly<br/>Text-to-Speech Neural]
        end
        
        subgraph "Language Analysis"
            COMPREHEND[Amazon Comprehend<br/>NLP & Entity Detection]
            TRANSLATE[Amazon Translate<br/>Multi-language Support]
        end
    end

    subgraph "Strands Agent Framework"
        SA[Strands Orchestrator<br/>Agent Coordination]
        
        subgraph "Agent Personalities"
            FT[Emma<br/>Friendly Tutor]
            ST[Professor Chen<br/>Strict Teacher]
            CP[Alex<br/>Conversation Partner]
            PC[Coach Riley<br/>Pronunciation Coach]
        end
        
        subgraph "Agent Capabilities"
            AR[Autonomous Reasoning<br/>Decision Making]
            EM[Emotion Detection<br/>User State Analysis]
            DA[Difficulty Adjustment<br/>Adaptive Learning]
            FT_SYS[Feedback Timing<br/>Optimal Delivery]
        end
    end

    subgraph "Data Storage Layer"
        subgraph "Amazon DynamoDB"
            UP[User Profiles<br/>Learning History]
            CS[Conversation Sessions<br/>Message History]
            AS_STATE[Agent State<br/>Context & Memory]
            PM[Progress Metrics<br/>Performance Data]
        end
        
        subgraph "Amazon S3"
            AF[Audio Files<br/>Conversation Recordings]
            SA_ASSETS[Static Assets<br/>Frontend Resources]
            BU[Backups<br/>Data Archives]
        end
    end

    subgraph "Real-time Analytics Layer"
        subgraph "Amazon Kinesis"
            KS[Kinesis Streams<br/>Event Processing]
            KA[Kinesis Analytics<br/>Real-time Insights]
            KF[Kinesis Firehose<br/>Data Delivery]
        end
        
        CW[CloudWatch<br/>Monitoring & Logs]
        XR[X-Ray<br/>Distributed Tracing]
    end

    subgraph "Infrastructure Layer"
        CDK[AWS CDK<br/>Infrastructure as Code]
        CF[CloudFormation<br/>Stack Management]
        IAM[IAM Roles<br/>Security & Permissions]
        VPC[VPC<br/>Network Isolation]
    end

    %% User Flow Connections
    UI --> VR
    VR --> GW
    UI --> AS
    UI --> FP
    AP --> UI

    %% API Gateway Connections
    GW --> AUTH
    GW --> CORS
    GW --> RATE
    GW --> CO

    %% Lambda Function Connections
    CO --> AC
    CO --> LA
    CO --> PA
    CO --> RE

    %% AI Service Connections
    AC --> CLAUDE
    AC --> LLAMA
    AC --> NOVA
    CO --> TRANSCRIBE
    CO --> POLLY
    LA --> COMPREHEND
    RE --> TRANSLATE

    %% Strands Framework Connections
    AC --> SA
    SA --> FT
    SA --> ST
    SA --> CP
    SA --> PC
    SA --> AR
    SA --> EM
    SA --> DA
    SA --> FT_SYS

    %% Data Storage Connections
    CO --> UP
    CO --> CS
    AC --> AS_STATE
    PA --> PM
    CO --> AF
    UI --> SA_ASSETS

    %% Analytics Connections
    CO --> KS
    PA --> KA
    KS --> KF
    CO --> CW
    AC --> XR

    %% Infrastructure Connections
    CDK --> CF
    CF --> IAM
    CF --> VPC

    %% Styling
    classDef userLayer fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef apiLayer fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef computeLayer fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef aiLayer fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef strandsLayer fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef dataLayer fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef analyticsLayer fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef infraLayer fill:#fafafa,stroke:#424242,stroke-width:2px

    class UI,VR,AP,AS,FP userLayer
    class GW,AUTH,CORS,RATE apiLayer
    class CO,AC,LA,PA,RE computeLayer
    class CLAUDE,LLAMA,NOVA,TRANSCRIBE,POLLY,COMPREHEND,TRANSLATE aiLayer
    class SA,FT,ST,CP,PC,AR,EM,DA,FT_SYS strandsLayer
    class UP,CS,AS_STATE,PM,AF,SA_ASSETS,BU dataLayer
    class KS,KA,KF,CW,XR analyticsLayer
    class CDK,CF,IAM,VPC infraLayer
```

## 🔄 Offline-First Data Flow

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React Frontend
    participant LS as Local Storage
    participant MR as Mock Responses
    participant GW as API Gateway (Optional)

    U->>UI: Starts conversation
    UI->>LS: Generate local session ID
    LS-->>UI: Return session-{timestamp}-{random}
    
    UI->>MR: Get agent greeting
    MR-->>UI: Return personality-based greeting
    UI->>UI: Play TTS with event-driven completion
    UI-->>U: Display agent message
    
    U->>UI: Speaks or types message
    UI->>LS: Store user message locally
    
    alt API Available
        UI->>GW: Send message to backend
        GW-->>UI: Return AI response with feedback
    else Enhanced Offline Mode
        UI->>MR: Analyze input context
        MR->>IF: Generate realistic feedback
        IF-->>MR: Return dynamic scores
        MR-->>UI: Return contextual AI response + feedback
    end
    
    UI->>LS: Store conversation state
    UI-->>U: Display agent response
    
    Note over UI,LS: Enhanced offline mode provides:<br/>• Contextual AI responses<br/>• Realistic feedback generation<br/>• Personality-driven interactions<br/>• Seamless user experience
```

## 🔄 Data Flow Architecture

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React Frontend
    participant GW as API Gateway
    participant CO as Conversation Orchestrator
    participant T as Amazon Transcribe
    participant SA as Strands Agent
    participant B as AWS Bedrock
    participant P as Amazon Polly
    participant DB as DynamoDB
    participant K as Kinesis

    U->>UI: Speaks into microphone
    UI->>GW: Send audio stream
    GW->>CO: Route to orchestrator
    CO->>T: Process speech-to-text
    T-->>CO: Return transcription
    
    CO->>SA: Send user message + context
    SA->>B: Generate agent response
    B-->>SA: Return AI response
    SA-->>CO: Return processed response
    
    CO->>P: Convert response to speech
    P-->>CO: Return audio stream
    CO->>DB: Save conversation state
    CO->>K: Stream analytics data
    
    CO-->>GW: Return response + audio
    GW-->>UI: Send to frontend
    UI->>UI: Play TTS with event completion handling
    UI-->>U: Play agent response
    
    Note over SA: Autonomous decisions:<br/>- Topic selection<br/>- Difficulty adjustment<br/>- Feedback timing<br/>- Emotion detection
```

## 🎯 Agent Decision Flow

```mermaid
flowchart TD
    START([User Input Received]) --> ANALYZE[Analyze User Message]
    
    ANALYZE --> EMOTION{Detect Emotional State}
    EMOTION -->|Frustrated| SUPPORT[Provide Extra Support]
    EMOTION -->|Confident| CHALLENGE[Increase Difficulty]
    EMOTION -->|Neutral| CONTINUE[Continue Current Level]
    
    SUPPORT --> AGENT_SELECT{Select Agent Response}
    CHALLENGE --> AGENT_SELECT
    CONTINUE --> AGENT_SELECT
    
    AGENT_SELECT -->|Grammar Focus| GRAMMAR[Grammar Correction Mode]
    AGENT_SELECT -->|Conversation| CASUAL[Casual Conversation Mode]
    AGENT_SELECT -->|Pronunciation| PHONETIC[Pronunciation Practice Mode]
    
    GRAMMAR --> BEDROCK[Generate Response via Bedrock]
    CASUAL --> BEDROCK
    PHONETIC --> BEDROCK
    
    BEDROCK --> FEEDBACK{Provide Feedback?}
    FEEDBACK -->|Yes| TIMING[Optimal Timing Check]
    FEEDBACK -->|No| RESPOND[Generate Response Only]
    
    TIMING -->|Good Time| DETAILED[Detailed Feedback]
    TIMING -->|Wait| BRIEF[Brief Encouragement]
    
    DETAILED --> RESPOND
    BRIEF --> RESPOND
    
    RESPOND --> POLLY[Convert to Speech]
    POLLY --> SAVE[Save to Database]
    SAVE --> ANALYTICS[Stream Analytics]
    ANALYTICS --> END([Response Delivered])
    
    %% Styling
    classDef decision fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef process fill:#d5e8d4,stroke:#82b366,stroke-width:2px
    classDef endpoint fill:#f8cecc,stroke:#b85450,stroke-width:2px
    
    class EMOTION,AGENT_SELECT,FEEDBACK,TIMING decision
    class ANALYZE,SUPPORT,CHALLENGE,CONTINUE,GRAMMAR,CASUAL,PHONETIC,BEDROCK,DETAILED,BRIEF,RESPOND,POLLY,SAVE,ANALYTICS process
    class START,END endpoint
```

## 🏗️ AWS Services Integration

```mermaid
graph LR
    subgraph "Frontend"
        FE[React SPA<br/>CloudFront CDN]
    end
    
    subgraph "API Layer"
        AG[API Gateway<br/>REST + WebSocket]
    end
    
    subgraph "Compute"
        L1[Lambda: Orchestrator]
        L2[Lambda: Agent Coordinator]
        L3[Lambda: Language Analyzer]
        L4[Lambda: Progress Tracker]
    end
    
    subgraph "AI/ML Services"
        BR[Bedrock<br/>Foundation Models]
        TR[Transcribe<br/>Speech-to-Text]
        PO[Polly<br/>Text-to-Speech]
        CO[Comprehend<br/>Language Analysis]
    end
    
    subgraph "Storage"
        DB[DynamoDB<br/>NoSQL Database]
        S3[S3<br/>Object Storage]
    end
    
    subgraph "Analytics"
        KI[Kinesis<br/>Real-time Streaming]
        CW[CloudWatch<br/>Monitoring]
    end
    
    FE --> AG
    AG --> L1
    L1 --> L2
    L1 --> L3
    L1 --> L4
    
    L2 --> BR
    L1 --> TR
    L1 --> PO
    L3 --> CO
    
    L1 --> DB
    L1 --> S3
    L4 --> KI
    L1 --> CW
    
    %% Styling
    classDef frontend fill:#e3f2fd,stroke:#1976d2,stroke-width:2px
    classDef api fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    classDef compute fill:#e8f5e8,stroke:#388e3c,stroke-width:2px
    classDef ai fill:#fff8e1,stroke:#f57c00,stroke-width:2px
    classDef storage fill:#e0f2f1,stroke:#00796b,stroke-width:2px
    classDef analytics fill:#fce4ec,stroke:#c2185b,stroke-width:2px
    
    class FE frontend
    class AG api
    class L1,L2,L3,L4 compute
    class BR,TR,PO,CO ai
    class DB,S3 storage
    class KI,CW analytics
```

## 📊 Performance Metrics

| Component | Target Performance | Monitoring |
|-----------|-------------------|------------|
| **Voice Processing** | < 2s transcription latency | CloudWatch Metrics |
| **Agent Response** | < 3s total response time | X-Ray Tracing |
| **Database Queries** | < 100ms average | DynamoDB Metrics |
| **API Gateway** | < 50ms routing | API Gateway Logs |
| **Frontend Loading** | < 2s initial load | CloudFront Analytics |

## 🔒 Security Architecture

```mermaid
graph TB
    subgraph "Security Layers"
        WAF[AWS WAF<br/>Web Application Firewall]
        CF[CloudFront<br/>DDoS Protection]
        AG[API Gateway<br/>Authentication & Authorization]
        IAM[IAM Roles<br/>Least Privilege Access]
        VPC[VPC<br/>Network Isolation]
        KMS[AWS KMS<br/>Encryption at Rest]
    end
    
    subgraph "Data Protection"
        ENC[Encryption in Transit<br/>TLS 1.3]
        AUDIT[CloudTrail<br/>Audit Logging]
        SECRETS[Secrets Manager<br/>API Keys & Tokens]
    end
    
    WAF --> CF
    CF --> AG
    AG --> IAM
    IAM --> VPC
    VPC --> KMS
    
    ENC --> AUDIT
    AUDIT --> SECRETS
```

## 🔄 Enhanced Offline Mode Architecture

```mermaid
flowchart TD
    USER[User Input] --> DETECT{API Available?}
    
    DETECT -->|Yes| ONLINE[Online Mode]
    DETECT -->|No| OFFLINE[Enhanced Offline Mode]
    
    ONLINE --> API[Send to API Gateway]
    API --> BEDROCK[AWS Bedrock Response]
    BEDROCK --> RESPONSE[AI Response + Feedback]
    
    OFFLINE --> ANALYZE[Analyze Input Context]
    ANALYZE --> CATEGORY{Categorize Input}
    
    CATEGORY -->|Greeting| GREETING_RESP[Greeting Responses]
    CATEGORY -->|Question| QUESTION_RESP[Question Responses]
    CATEGORY -->|Practice| PRACTICE_RESP[Practice Responses]
    CATEGORY -->|Personal| PERSONAL_RESP[Personal Responses]
    CATEGORY -->|Default| DEFAULT_RESP[Default Responses]
    
    GREETING_RESP --> PERSONALITY[Apply Agent Personality]
    QUESTION_RESP --> PERSONALITY
    PRACTICE_RESP --> PERSONALITY
    PERSONAL_RESP --> PERSONALITY
    DEFAULT_RESP --> PERSONALITY
    
    PERSONALITY --> FEEDBACK_GEN[Generate Realistic Feedback]
    FEEDBACK_GEN --> SCORES[Calculate Dynamic Scores]
    SCORES --> SUGGESTIONS[Generate Suggestions]
    SUGGESTIONS --> MOCK_RESPONSE[Enhanced Mock Response]
    
    RESPONSE --> DISPLAY[Display to User]
    MOCK_RESPONSE --> DISPLAY
    
    DISPLAY --> STORAGE[Store in Local Storage]
    
    %% Styling
    classDef online fill:#d5e8d4,stroke:#82b366,stroke-width:2px
    classDef offline fill:#fff2cc,stroke:#d6b656,stroke-width:2px
    classDef decision fill:#f8cecc,stroke:#b85450,stroke-width:2px
    
    class ONLINE,API,BEDROCK,RESPONSE online
    class OFFLINE,ANALYZE,GREETING_RESP,QUESTION_RESP,PRACTICE_RESP,PERSONAL_RESP,DEFAULT_RESP,PERSONALITY,FEEDBACK_GEN,SCORES,SUGGESTIONS,MOCK_RESPONSE offline
    class DETECT,CATEGORY decision
```

### Offline Mode Features

- **Context Analysis**: Categorizes user input for appropriate response selection
- **Personality Preservation**: Each agent maintains distinct conversation styles
- **Realistic Feedback**: Dynamic scoring based on message complexity and length
- **Intelligent Suggestions**: Contextual recommendations for improvement
- **Seamless Experience**: Users cannot distinguish between online and offline modes

This architecture ensures:
- **Scalability**: Serverless components auto-scale based on demand
- **Reliability**: Multi-AZ deployment with automatic failover + enhanced offline fallbacks
- **Security**: End-to-end encryption and least-privilege access
- **Performance**: Edge caching and optimized data flows + instant offline responses
- **Cost Efficiency**: Pay-per-use pricing model + zero-cost offline functionality
- **Accessibility**: Full functionality regardless of network conditions