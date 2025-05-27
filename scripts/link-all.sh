#!/bin/bash

# Function to link packages in a directory
link_packages() {
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
            echo "Linking package: $package"
            cd "$package" || exit
            bun link
            cd - > /dev/null || exit
        fi
    done
}

# Link all packages
echo "Linking packages..."
link_packages "packages"

# Link all examples
echo "Linking examples..."
link_packages "examples"

echo "All packages and examples have been linked!" 