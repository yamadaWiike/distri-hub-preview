pipeline {
    agent any
    
    stages {
        stage('Install') {
            steps {
                sh 'npm install vite --save-dev'
                sh 'rm -rf dist'
            }
        }
        stage('Setup Environment') {
            steps {
                script {
                    // Create .env file from Jenkins credentials or use .env.example
                    sh '''
                        if [ ! -f .env ]; then
                            echo "Creating .env from .env.example..."
                            cp .env.example .env || echo "No .env.example found, skipping..."
                        fi
                    '''
                }
            }
        }
        stage('Build') {
            steps {
                // Use the Jenkins-specific build script
                sh 'pnpm run build:jenkins'
            }
        }
        // Add any other stages you need (test, deploy, etc.)
    }
}