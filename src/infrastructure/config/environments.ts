// Environment-specific configurations for LanguagePeer

export interface EnvironmentConfig {
  environment: string;
  region: string;
  account?: string;
  
  // DynamoDB Configuration
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
    pointInTimeRecovery: boolean;
    encryption: boolean;
  };
  
  // API Gateway Configuration
  api: {
    throttlingRateLimit: number;
    throttlingBurstLimit: number;
    corsOrigins: string[];
  };
  
  // S3 Configuration
  s3: {
    versioning: boolean;
    lifecycleRules: boolean;
    retentionDays: number;
  };
  
  // Kinesis Configuration
  kinesis: {
    shardCount: number;
    retentionDays: number;
  };
  
  // Monitoring Configuration
  monitoring: {
    logRetentionDays: number;
    enableXRayTracing: boolean;
    enableDetailedMetrics: boolean;
  };
  
  // Security Configuration
  security: {
    enableWAF: boolean;
    enableGuardDuty: boolean;
    encryptionAtRest: boolean;
  };
}

export const environments: Record<string, EnvironmentConfig> = {
  development: {
    environment: 'development',
    region: 'us-east-1',
    
    dynamodb: {
      billingMode: 'PAY_PER_REQUEST',
      pointInTimeRecovery: false,
      encryption: true
    },
    
    api: {
      throttlingRateLimit: 100,
      throttlingBurstLimit: 200,
      corsOrigins: ['*']
    },
    
    s3: {
      versioning: true,
      lifecycleRules: true,
      retentionDays: 7
    },
    
    kinesis: {
      shardCount: 1,
      retentionDays: 1
    },
    
    monitoring: {
      logRetentionDays: 7,
      enableXRayTracing: false,
      enableDetailedMetrics: false
    },
    
    security: {
      enableWAF: false,
      enableGuardDuty: false,
      encryptionAtRest: true
    }
  },
  
  staging: {
    environment: 'staging',
    region: 'us-east-1',
    
    dynamodb: {
      billingMode: 'PAY_PER_REQUEST',
      pointInTimeRecovery: true,
      encryption: true
    },
    
    api: {
      throttlingRateLimit: 500,
      throttlingBurstLimit: 1000,
      corsOrigins: ['https://staging.languagepeer.com']
    },
    
    s3: {
      versioning: true,
      lifecycleRules: true,
      retentionDays: 30
    },
    
    kinesis: {
      shardCount: 2,
      retentionDays: 7
    },
    
    monitoring: {
      logRetentionDays: 30,
      enableXRayTracing: true,
      enableDetailedMetrics: true
    },
    
    security: {
      enableWAF: true,
      enableGuardDuty: true,
      encryptionAtRest: true
    }
  },
  
  production: {
    environment: 'production',
    region: 'us-east-1',
    
    dynamodb: {
      billingMode: 'PAY_PER_REQUEST',
      pointInTimeRecovery: true,
      encryption: true
    },
    
    api: {
      throttlingRateLimit: 1000,
      throttlingBurstLimit: 2000,
      corsOrigins: ['https://languagepeer.com', 'https://app.languagepeer.com']
    },
    
    s3: {
      versioning: true,
      lifecycleRules: true,
      retentionDays: 90
    },
    
    kinesis: {
      shardCount: 5,
      retentionDays: 7
    },
    
    monitoring: {
      logRetentionDays: 90,
      enableXRayTracing: true,
      enableDetailedMetrics: true
    },
    
    security: {
      enableWAF: true,
      enableGuardDuty: true,
      encryptionAtRest: true
    }
  }
};

export function getEnvironmentConfig(environment: string): EnvironmentConfig {
  const config = environments[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return config;
}