# Docker Commands Cheatsheet

Commands I use daily but always have to look up.

## Containers

```bash
docker ps                    # Running containers
docker ps -a                 # All containers
docker logs -f <container>   # Follow logs
docker exec -it <c> sh       # Shell into container
docker stop $(docker ps -q)  # Stop all running
```

## Images

```bash
docker images                # List images
docker rmi <image>           # Remove image
docker build -t name .       # Build with tag
docker system prune -a       # Clean everything
```

## Compose

```bash
docker compose up -d         # Start detached
docker compose down          # Stop and remove
docker compose logs -f       # Follow all logs
docker compose ps            # List services
```

## Debugging

```bash
docker inspect <container>   # Full details
docker stats                 # Resource usage
docker network ls            # List networks
```

Pro tip: Use `docker compose` (v2) not `docker-compose` (v1).
