# Development Environment

This directory contains Docker Compose configuration for local development.

## Services

### PostgreSQL
- **Port**: 5440
- **Database**: devdb
- **User**: devuser
- **Password**: devpass
- **Connection String**: `postgresql://devuser:devpass@localhost:5440/devdb`

### Adminer (Database UI)
- **Port**: 8080
- **URL**: http://localhost:8080
- Database management interface for PostgreSQL

### MinIO (S3-Compatible Storage)
- **S3 API Port**: 9000
- **Console Port**: 9001
- **Console URL**: http://localhost:9001
- **Access Key**: minioadmin
- **Secret Key**: minioadmin
- **Default Bucket**: nowaster-backups

## Quick Start

1. Start all services:
   ```bash
   cd deploy/dev
   docker-compose up -d
   ```

2. View logs:
   ```bash
   docker-compose logs -f
   ```

3. Stop services:
   ```bash
   docker-compose down
   ```

## MinIO Configuration

MinIO provides S3-compatible object storage for database backups.

### Access the Console
Visit http://localhost:9001 and login with:
- Username: `minioadmin`
- Password: `minioadmin`

### S3 Endpoint Configuration
For the backup script or application, use these environment variables:

```bash
AWS_S3_BUCKET_NAME=nowaster-backups
AWS_DEFAULT_REGION=us-east-1
AWS_ENDPOINT_URL=http://localhost:9000
AWS_ACCESS_KEY_ID=minioadmin
AWS_SECRET_ACCESS_KEY=minioadmin
```

### Using AWS CLI with MinIO

```bash
# Configure AWS CLI for MinIO
aws configure --profile minio
# Access Key: minioadmin
# Secret Key: minioadmin
# Region: us-east-1

# List buckets
aws --profile minio --endpoint-url http://localhost:9000 s3 ls

# List files in backup bucket
aws --profile minio --endpoint-url http://localhost:9000 s3 ls s3://nowaster-backups/

# Upload a file
aws --profile minio --endpoint-url http://localhost:9000 s3 cp backup.dump s3://nowaster-backups/
```

## Volume Management

To clear all data and start fresh:

```bash
docker-compose down -v
```

This will remove:
- `postgres_data` - PostgreSQL database files
- `minio_data` - MinIO storage files
