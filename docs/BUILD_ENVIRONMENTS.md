# Build Environment Configurations

This project uses different memory settings for different environments to optimize performance and resource usage.

## Available Build Commands

### Development Environment (High Memory)

```bash
npm run build:dev          # 4GB memory limit - for development machines
npm run build:analyze      # Uses build:dev - for bundle analysis
npm run build:test         # Uses build:dev - for development testing
```

### Production Environment (Memory Constrained)

```bash
npm run build:production   # 768MB memory limit - for VPS deployment
npm run deploy:production  # Intelligent script that detects available memory
```

### Default Build

```bash
npm run build             # 1.5GB memory limit - balanced default
```

## Memory Settings Explained

| Command            | Memory Limit   | Use Case                                        |
| ------------------ | -------------- | ----------------------------------------------- |
| `build:dev`        | 4096MB (4GB)   | Local development, CI/CD, analysis              |
| `build`            | 1536MB (1.5GB) | General purpose, Docker builds                  |
| `build:production` | 768MB          | VPS deployment, memory-constrained environments |

## Production Deployment

For VPS deployment, use the intelligent deployment script:

```bash
npm run deploy:production
```

This script will:

- Detect available system memory
- Choose appropriate memory settings automatically
- Fall back to ultra-conservative settings (512MB) if needed
- Verify the build completed successfully

## Environment Detection

The `deploy:production` script automatically detects memory constraints:

- **< 1GB available**: Uses 512MB with additional optimizations
- **1-2GB available**: Uses 768MB (standard production)
- **> 2GB available**: Uses 768MB (no need to go higher in production)

## Manual Override

You can manually set memory limits using NODE_OPTIONS:

```bash
# Ultra-low memory (emergency)
NODE_OPTIONS='--max-old-space-size=512 --optimize-for-size' npm run build

# Custom memory limit
NODE_OPTIONS='--max-old-space-size=2048' npm run build
```

## Troubleshooting

### Out of Memory Errors

1. **Development**: Use `npm run build:dev` for more memory
2. **Production**: Use `npm run deploy:production` for intelligent detection
3. **Emergency**: Manually set NODE_OPTIONS to 512MB or lower

### Build Performance

- **Fast builds**: Use `build:dev` (more memory = faster)
- **Memory efficient**: Use `build:production` (less memory = slower but stable)

### VPS Deployment

Always use `npm run deploy:production` for VPS deployment as it:

- Automatically detects memory constraints
- Uses optimal settings for your server
- Provides fallback options if builds fail
- Verifies successful completion
