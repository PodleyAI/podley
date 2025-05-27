#!/bin/bash

# Function to link packages in a directory
unlink_packages() {
    local dir=$1
    echo "Processing directory: $dir"
    
    # Check if directory exists
    if [ ! -d "$dir" ]; then
        echo "Directory $dir does not exist"
        return
    fi
    
    # Iterate through each subdirectory
    for package in "$dir"/*/; do
        if [ -d "$package" ]; then
            echo "Unlinking package: $package"
            cd "$package" || exit
            bun unlink
            cd - > /dev/null || exit
        fi
    done
}

# Unlink all packages
echo "Unlinking packages..."
unlink_packages "packages"

# Unlink all examples
echo "Unlinking examples..."
unlink_packages "examples"

echo "All packages and examples have been unlinked!" 