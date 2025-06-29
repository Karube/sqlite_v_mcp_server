# Embedding Configuration Guide

This guide explains how to configure embedding models in the MCP Vector Server.

## Overview

The MCP Vector Server now supports configurable embedding models, allowing you to:
- Switch between different OpenAI embedding models
- Configure embedding dimensions for models that support it
- Adjust batch processing parameters
- Prepare for future support of other embedding providers

## Configuration Options

All embedding configuration is done through environment variables:

### EMBEDDING_MODEL
- **Default**: `text-embedding-3-small`
- **Options**: 
  - `text-embedding-3-small` - Newest, most cost-effective model
  - `text-embedding-3-large` - Highest performance model
  - `text-embedding-ada-002` - Legacy model (fixed 1536 dimensions)

### EMBEDDING_DIMENSIONS
- **Default**: `1536`
- **Range**: Depends on the model:
  - `text-embedding-3-small`: 512-1536
  - `text-embedding-3-large`: 256-3072
  - `text-embedding-ada-002`: 1536 (fixed)

### EMBEDDING_BATCH_SIZE
- **Default**: `100`
- **Range**: 1-2048
- Controls how many texts are sent to the OpenAI API in a single request

### EMBEDDING_PROVIDER
- **Default**: `openai`
- Currently only `openai` is supported

### EMBEDDING_ENCODING_FORMAT
- **Default**: `float`
- **Options**: `float`, `base64`

## Examples

### Using text-embedding-3-small with reduced dimensions
```bash
EMBEDDING_MODEL=text-embedding-3-small
EMBEDDING_DIMENSIONS=512
```

### Using text-embedding-3-large for maximum performance
```bash
EMBEDDING_MODEL=text-embedding-3-large
EMBEDDING_DIMENSIONS=3072
```

### Using legacy ada-002 model
```bash
EMBEDDING_MODEL=text-embedding-ada-002
# Dimensions are fixed at 1536 for this model
```

## Important Notes

1. **Database Compatibility**: When changing embedding dimensions, you'll need to create a new database or migrate existing data, as the vector table is created with fixed dimensions.

2. **Model Performance**: 
   - Smaller dimensions = faster search, less storage, but potentially lower accuracy
   - Larger dimensions = better accuracy, but more storage and slower search

3. **Cost Considerations**:
   - `text-embedding-3-small` is the most cost-effective
   - `text-embedding-3-large` provides the best performance but at higher cost
   - Consider your accuracy requirements vs. budget

4. **Validation**: The server validates configuration on startup and will fail to start with invalid settings.

## Migration Guide

If you need to change embedding models or dimensions for an existing database:

1. **Export your documents** (text and metadata)
2. **Configure new embedding settings** in your environment
3. **Create a new database** (rename or move the old one)
4. **Re-import your documents** using the batch loader

Example:
```bash
# 1. Backup existing database
mv data/vectors.db data/vectors-old.db

# 2. Set new configuration
export EMBEDDING_MODEL=text-embedding-3-large
export EMBEDDING_DIMENSIONS=3072

# 3. Start server (creates new database)
npm start -- --http

# 4. Re-import documents
npm run batch-load -- your-documents.json
```

## Future Considerations

The configuration system is designed to support additional embedding providers in the future, such as:
- Cohere
- Voyage AI
- Custom embedding servers
- Local embedding models

When these are added, you'll be able to switch providers using the `EMBEDDING_PROVIDER` variable.