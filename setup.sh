#!/bin/bash

# Print colored output
print_color() {
    case $2 in
        "green") echo -e "\033[32m$1\033[0m" ;;
        "red") echo -e "\033[31m$1\033[0m" ;;
        "yellow") echo -e "\033[33m$1\033[0m" ;;
        *) echo "$1" ;;
    esac
}

# Check if Python is installed
check_python() {
    if ! command -v python &> /dev/null; then
        print_color "Python is not installed. Please install Python first." "red"
        exit 1
    fi
    print_color "✓ Python is installed" "green"
}

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_color "Node.js is not installed. Please install Node.js first." "red"
        exit 1
    fi
    print_color "✓ Node.js is installed" "green"
}

# Check if npm is installed
check_npm() {
    if ! command -v npm &> /dev/null; then
        print_color "npm is not installed. Please install npm first." "red"
        exit 1
    fi
    print_color "✓ npm is installed" "green"
}

# Create and activate Python virtual environment
setup_python_env() {
    print_color "\nSetting up Python virtual environment..." "yellow"
    if [ -d "venv" ]; then
        print_color "Virtual environment already exists. Skipping creation." "yellow"
    else
        python -m venv venv
        print_color "Created new virtual environment" "green"
    fi

    # Activate virtual environment
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
    elif [ -f "venv/Scripts/activate" ]; then
        source venv/Scripts/activate
    else
        print_color "Could not find virtual environment activation script" "red"
        exit 1
    fi
    print_color "✓ Virtual environment activated" "green"
}

# Install backend dependencies
install_backend() {
    print_color "\nInstalling backend dependencies..." "yellow"
    cd backend
    pip install -r requirements.txt
    if [ $? -eq 0 ]; then
        print_color "✓ Backend dependencies installed successfully" "green"
    else
        print_color "Failed to install backend dependencies" "red"
        exit 1
    fi
    cd ..
}

# Install frontend dependencies
install_frontend() {
    print_color "\nInstalling frontend dependencies..." "yellow"
    cd frontend
    npm install
    if [ $? -eq 0 ]; then
        print_color "✓ Frontend dependencies installed successfully" "green"
    else
        print_color "Failed to install frontend dependencies" "red"
        exit 1
    fi
    cd ..
}

# Main setup process
main() {
    print_color "Starting setup process...\n" "yellow"
    
    # Check prerequisites
    check_python
    check_node
    check_npm
    
    # Setup backend
    setup_python_env
    install_backend
    
    # Setup frontend
    install_frontend
    
    print_color "\nSetup completed successfully! 🎉" "green"
    print_color "\nTo run the application:" "yellow"
    print_color "1. Start the backend server: python run.py" "yellow"
    print_color "2. The application will automatically start both frontend and backend servers" "yellow"
    print_color "3. Access the application at http://localhost:3000" "yellow"
}

# Run main setup
main 