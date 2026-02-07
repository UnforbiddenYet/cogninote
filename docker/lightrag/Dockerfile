FROM python:3.11-slim

WORKDIR /app

# Install uv package manager
RUN pip install uv

# Install LightRAG with API server support
RUN uv tool install "lightrag-hku[api]"

# Ensure lightrag-server is in PATH
ENV PATH="/root/.local/bin:$PATH"

# Create data directory
RUN mkdir -p /app/lightrag_data

# Expose API port
EXPOSE 8020

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8020/health')" || exit 1

# Start LightRAG server
CMD ["lightrag-server", "--host", "0.0.0.0", "--port", "8020"]
