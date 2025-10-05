# Architecture Diagram

## Mermaid Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[User Interface]
        VP[Voice Processor]
        AC[Audio Controller]
    end
    
    subgraph "API Gateway"
        GW[Gateway Service]
        AUTH[Authentication]
        RATE[Rate Limiting]
    end
    
    subgraph "Core Services"
        CS[Conversation Service]
        AS[Agent Service]
        LS[Language Analysis Service]
        PS[Progress Service]
    end
    
    subgraph "AWS AI/ML Services"
        BEDROCK[AWS Bedrock + Strands]
        TRANSCRIBE[Amazon Transcribe]
        POLLY[Amazon Polly]
        COMPREHEND[Amazon Comprehend]
    end
    
    subgraph "AWS Data Layer"
        DYNAMO[(DynamoDB)]
        S3[(S3 Storage)]
        ELASTICACHE[(ElastiCache)]
        KINESIS[Kinesis Analytics]
    end
    
    UI --> VP
    VP --> AC
    AC --> GW
    GW --> AUTH
    GW --> RATE
    GW --> CS
    CS --> AS
    CS --> LS
    CS --> PS
    AS --> BEDROCK
    VP --> TRANSCRIBE
    CS --> POLLY
    LS --> COMPREHEND
    PS --> DYNAMO
    CS --> S3
    PS --> KINESIS
    CS --> ELASTICACHE
```

## Visual Architecture

To generate a PNG version of this diagram:
1. Use Mermaid CLI: `mmdc -i docs/architecture-diagram.md -o docs/architecture-diagram.png`
2. Or use online tools like [Mermaid Live Editor](https://mermaid.live/)