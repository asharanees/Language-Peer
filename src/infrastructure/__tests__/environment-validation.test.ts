import { getEnvironmentConfig, environments } from '../config/environments';

describe('Environment Configuration Validation', () => {
  describe('Environment Config Structure', () => {
    test('all environments have required properties', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(config).toHaveProperty('environment');
        expect(config).toHaveProperty('region');
        expect(config).toHaveProperty('dynamodb');
        expect(config).toHaveProperty('api');
        expect(config).toHaveProperty('s3');
        expect(config).toHaveProperty('kinesis');
        expect(config).toHaveProperty('monitoring');
        expect(config).toHaveProperty('security');
      });
    });

    test('DynamoDB configuration is valid', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(['PAY_PER_REQUEST', 'PROVISIONED']).toContain(config.dynamodb.billingMode);
        expect(typeof config.dynamodb.pointInTimeRecovery).toBe('boolean');
        expect(typeof config.dynamodb.encryption).toBe('boolean');
      });
    });

    test('API configuration has valid throttling limits', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(config.api.throttlingRateLimit).toBeGreaterThan(0);
        expect(config.api.throttlingBurstLimit).toBeGreaterThan(config.api.throttlingRateLimit);
        expect(Array.isArray(config.api.corsOrigins)).toBe(true);
      });
    });

    test('S3 configuration is valid', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(typeof config.s3.versioning).toBe('boolean');
        expect(typeof config.s3.lifecycleRules).toBe('boolean');
        expect(config.s3.retentionDays).toBeGreaterThan(0);
      });
    });

    test('Kinesis configuration is valid', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(config.kinesis.shardCount).toBeGreaterThan(0);
        expect(config.kinesis.retentionDays).toBeGreaterThan(0);
        expect(config.kinesis.retentionDays).toBeLessThanOrEqual(365);
      });
    });

    test('monitoring configuration is valid', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(config.monitoring.logRetentionDays).toBeGreaterThan(0);
        expect(typeof config.monitoring.enableXRayTracing).toBe('boolean');
        expect(typeof config.monitoring.enableDetailedMetrics).toBe('boolean');
      });
    });

    test('security configuration is valid', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        
        expect(typeof config.security.enableWAF).toBe('boolean');
        expect(typeof config.security.enableGuardDuty).toBe('boolean');
        expect(typeof config.security.encryptionAtRest).toBe('boolean');
      });
    });
  });

  describe('Environment-Specific Validation', () => {
    test('development environment has appropriate settings', () => {
      const config = getEnvironmentConfig('development');
      
      // Development should have relaxed settings for cost optimization
      expect(config.dynamodb.pointInTimeRecovery).toBe(false);
      expect(config.api.corsOrigins).toContain('*');
      expect(config.s3.retentionDays).toBeLessThanOrEqual(7);
      expect(config.kinesis.shardCount).toBe(1);
      expect(config.monitoring.enableXRayTracing).toBe(false);
      expect(config.security.enableWAF).toBe(false);
      expect(config.security.enableGuardDuty).toBe(false);
    });

    test('staging environment has enhanced settings', () => {
      const config = getEnvironmentConfig('staging');
      
      // Staging should have production-like settings
      expect(config.dynamodb.pointInTimeRecovery).toBe(true);
      expect(config.api.corsOrigins).not.toContain('*');
      expect(config.s3.retentionDays).toBeGreaterThan(7);
      expect(config.kinesis.shardCount).toBeGreaterThan(1);
      expect(config.monitoring.enableXRayTracing).toBe(true);
      expect(config.security.enableWAF).toBe(true);
      expect(config.security.enableGuardDuty).toBe(true);
    });

    test('production environment has maximum security and reliability', () => {
      const config = getEnvironmentConfig('production');
      
      // Production should have all security and reliability features enabled
      expect(config.dynamodb.pointInTimeRecovery).toBe(true);
      expect(config.api.corsOrigins).not.toContain('*');
      expect(config.s3.retentionDays).toBeGreaterThanOrEqual(90);
      expect(config.kinesis.shardCount).toBeGreaterThanOrEqual(5);
      expect(config.monitoring.enableXRayTracing).toBe(true);
      expect(config.monitoring.enableDetailedMetrics).toBe(true);
      expect(config.security.enableWAF).toBe(true);
      expect(config.security.enableGuardDuty).toBe(true);
      expect(config.security.encryptionAtRest).toBe(true);
    });
  });

  describe('Configuration Scaling', () => {
    test('API throttling limits scale appropriately across environments', () => {
      const devConfig = getEnvironmentConfig('development');
      const stagingConfig = getEnvironmentConfig('staging');
      const prodConfig = getEnvironmentConfig('production');
      
      expect(devConfig.api.throttlingRateLimit).toBeLessThan(stagingConfig.api.throttlingRateLimit);
      expect(stagingConfig.api.throttlingRateLimit).toBeLessThan(prodConfig.api.throttlingRateLimit);
      
      expect(devConfig.api.throttlingBurstLimit).toBeLessThan(stagingConfig.api.throttlingBurstLimit);
      expect(stagingConfig.api.throttlingBurstLimit).toBeLessThan(prodConfig.api.throttlingBurstLimit);
    });

    test('Kinesis shard count scales with environment', () => {
      const devConfig = getEnvironmentConfig('development');
      const stagingConfig = getEnvironmentConfig('staging');
      const prodConfig = getEnvironmentConfig('production');
      
      expect(devConfig.kinesis.shardCount).toBeLessThan(stagingConfig.kinesis.shardCount);
      expect(stagingConfig.kinesis.shardCount).toBeLessThan(prodConfig.kinesis.shardCount);
    });

    test('log retention scales with environment importance', () => {
      const devConfig = getEnvironmentConfig('development');
      const stagingConfig = getEnvironmentConfig('staging');
      const prodConfig = getEnvironmentConfig('production');
      
      expect(devConfig.monitoring.logRetentionDays).toBeLessThan(stagingConfig.monitoring.logRetentionDays);
      expect(stagingConfig.monitoring.logRetentionDays).toBeLessThan(prodConfig.monitoring.logRetentionDays);
    });
  });

  describe('Error Handling', () => {
    test('throws error for unknown environment', () => {
      expect(() => {
        getEnvironmentConfig('unknown-environment');
      }).toThrow('Unknown environment: unknown-environment');
    });

    test('handles case sensitivity', () => {
      expect(() => {
        getEnvironmentConfig('PRODUCTION');
      }).toThrow('Unknown environment: PRODUCTION');
    });
  });

  describe('CORS Configuration', () => {
    test('development allows all origins', () => {
      const config = getEnvironmentConfig('development');
      expect(config.api.corsOrigins).toContain('*');
    });

    test('staging has specific domain restrictions', () => {
      const config = getEnvironmentConfig('staging');
      expect(config.api.corsOrigins).toEqual(['https://staging.languagepeer.com']);
    });

    test('production has multiple allowed domains', () => {
      const config = getEnvironmentConfig('production');
      expect(config.api.corsOrigins).toEqual([
        'https://languagepeer.com',
        'https://app.languagepeer.com'
      ]);
    });
  });

  describe('Cost Optimization Validation', () => {
    test('development environment optimizes for cost', () => {
      const config = getEnvironmentConfig('development');
      
      // Should use minimal resources
      expect(config.kinesis.shardCount).toBe(1);
      expect(config.s3.retentionDays).toBeLessThanOrEqual(7);
      expect(config.monitoring.logRetentionDays).toBeLessThanOrEqual(7);
      expect(config.kinesis.retentionDays).toBeLessThanOrEqual(1);
    });

    test('production environment prioritizes reliability over cost', () => {
      const config = getEnvironmentConfig('production');
      
      // Should use sufficient resources for reliability
      expect(config.kinesis.shardCount).toBeGreaterThanOrEqual(5);
      expect(config.s3.retentionDays).toBeGreaterThanOrEqual(90);
      expect(config.monitoring.logRetentionDays).toBeGreaterThanOrEqual(90);
    });
  });

  describe('Security Compliance', () => {
    test('all environments enforce encryption at rest', () => {
      Object.keys(environments).forEach(envName => {
        const config = environments[envName];
        expect(config.security.encryptionAtRest).toBe(true);
      });
    });

    test('production and staging enable security services', () => {
      const stagingConfig = getEnvironmentConfig('staging');
      const prodConfig = getEnvironmentConfig('production');
      
      expect(stagingConfig.security.enableWAF).toBe(true);
      expect(stagingConfig.security.enableGuardDuty).toBe(true);
      
      expect(prodConfig.security.enableWAF).toBe(true);
      expect(prodConfig.security.enableGuardDuty).toBe(true);
    });
  });
});