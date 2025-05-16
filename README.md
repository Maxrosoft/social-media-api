# Social Media API

### Getting started

1. Clone the repository
    
```bash
git clone https://github.com/Maxrosoft/social-media-api.git
cd social-media-api
```

2. Start all services in production mode

```bash
make up
```

3. Start all services in development mode (with hot reload)

```bash
make dev
```

4. Run tests for all microservices

```bash
make test
```

5. Shut everything down

```bash
make down
```

### Install dependencies in all services

Use the script to install packages in all services at once:

```bash
./install-all.sh <package-names> [options]
```

For example:

```bash
./install-all.sh express --save-dev
```

Make the script executable once:

```bash
chmod +x install-all.sh
```