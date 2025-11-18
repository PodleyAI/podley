# Base image with Node.js
FROM mcr.microsoft.com/devcontainers/typescript-node:24

# Install zsh and optional tools
RUN apt-get update && \
    apt-get install -y zsh git curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Bun as the node user
RUN su - node -c "curl -fsSL https://bun.sh/install | bash"

# Expose bun globally
RUN ln -s /home/node/.bun/bin/bun /usr/local/bin/bun
RUN ln -s /home/node/.bun/bin/bunx /usr/local/bin/bunx

# Set zsh as default shell for the existing non-root user (node in this image)
ARG USERNAME=node
RUN if id -u "$USERNAME" >/dev/null 2>&1; then chsh -s "$(which zsh)" "$USERNAME"; else echo "user $USERNAME not found"; fi

# Default shell
CMD [ "zsh" ]
